from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_restx import Api, Resource, fields
from models import db, Order, OrderItem
from config import Config
import os
import requests

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
CORS(app)

api = Api(app, doc='/api-docs/', version='1.0',
          title='Order Service API',
          description='API for creating and managing orders',
          security='Bearer Auth',
          authorizations={
              'Bearer Auth': {
                  'type': 'apiKey',
                  'in': 'header',
                  'name': 'Authorization',
                  'description': 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"'
              }
          })

# API Models
order_item_model = api.model('OrderItem', {
    'menu_item_id': fields.Integer(required=True, description='ID of the menu item'),
    'quantity': fields.Integer(required=True, description='Quantity of the menu item'),
    'price_at_time': fields.Float(required=True, description='Price of the item at the time of order')
})

order_model = api.model('Order', {
    'id': fields.Integer(readOnly=True, description='The unique identifier of an order'),
    'user_id': fields.Integer(required=True, description='The ID of the user who placed the order'),
    'restaurant_id': fields.Integer(required=True, description='The ID of the restaurant for the order'),
    'total_price': fields.Float(required=True, description='The total price of the order'),
    'status': fields.String(required=True, description='The current status of the order (e.g., PENDING, PAID, FAILED, CANCELLED)'),
    'created_at': fields.DateTime(readOnly=True, description='The timestamp when the order was created'),
    'updated_at': fields.DateTime(readOnly=True, description='The timestamp when the order was last updated'),
    'items': fields.List(fields.Nested(order_item_model), description='List of items in the order')
})

order_item_input_model = api.model('OrderItemInput', {
    'menu_item_id': fields.Integer(required=True),
    'quantity': fields.Integer(required=True)
})
order_input_model = api.model('OrderInput', {
    'user_id': fields.Integer(required=True),
    'restaurant_id': fields.Integer(required=True),
    'items': fields.List(fields.Nested(order_item_input_model), required=True)
})
# (Model output bisa ditambahkan agar lebih lengkap)

orders_ns = api.namespace('orders', description='Order operations')

@orders_ns.route('/')
class OrderList(Resource):
    @orders_ns.doc('list_orders', security='Bearer Auth')
    @orders_ns.marshal_list_with(order_model)
    def get(self):
        """List all orders"""
        orders = Order.query.all()
        return [o.to_dict() for o in orders]

    @orders_ns.doc('create_order', security='Bearer Auth')
    @orders_ns.expect(order_input_model)
    @orders_ns.marshal_with(order_model, code=201)
    def post(self):
        """
        Create a new order.
        Ini adalah CONSUMER endpoint utama.
        Mengonsumsi User, Restaurant, dan Payment service.
        """
        data = request.get_json()
        user_id = data.get('user_id')
        restaurant_id = data.get('restaurant_id')
        item_inputs = data.get('items')
        
        try:
            # 1. Verifikasi User
            user_url = f"{Config.USER_SERVICE_URL}/internal/users/{user_id}"
            user_res = requests.get(user_url)
            if user_res.status_code != 200:
                return {'error': 'User not found'}, 404

            # 2. Verifikasi Menu Item & Hitung Total Harga
            total_price = 0
            order_items_data = []
            
            for item_in in item_inputs:
                item_id = item_in.get('menu_item_id')
                item_url = f"{Config.RESTAURANT_SERVICE_URL}/internal/menu-items/{item_id}"
                item_res = requests.get(item_url)
                
                if item_res.status_code != 200:
                    return {'error': f'Menu item {item_id} not found'}, 404
                
                item_data = item_res.json()
                price = item_data.get('price')
                quantity = item_in.get('quantity')
                
                total_price += price * quantity
                order_items_data.append({
                    'menu_item_id': item_id,
                    'quantity': quantity,
                    'price_at_time': price
                })

            # 3. Buat Order PENDING
            new_order = Order(
                user_id=user_id,
                restaurant_id=restaurant_id,
                total_price=total_price,
                status='PENDING'
            )
            db.session.add(new_order)
            db.session.commit() # Commit untuk dapat order ID

            # 4. Buat OrderItems
            for item_data in order_items_data:
                order_item = OrderItem(
                    order_id=new_order.id,
                    menu_item_id=item_data['menu_item_id'],
                    quantity=item_data['quantity'],
                    price_at_time=item_data['price_at_time']
                )
                db.session.add(order_item)
            
            db.session.commit()

            # 5. Proses Pembayaran (Panggil Payment Service)
            payment_url = f"{Config.PAYMENT_SERVICE_URL}/internal/process"
            payment_payload = {
                'user_id': user_id,
                'order_id': new_order.id,
                'amount': total_price
            }
            payment_res = requests.post(payment_url, json=payment_payload)

            if payment_res.status_code == 200:
                # 6. Sukses
                new_order.status = 'PAID'
                db.session.commit()
                return new_order.to_dict(), 201
            else:
                # 7. Gagal (misal: saldo kurang)
                new_order.status = 'FAILED'
                db.session.commit()
                return {'error': payment_res.json().get('error', 'Payment failed')}, 400

        except requests.exceptions.RequestException as e:
            # Gagal konek ke service lain
            return jsonify({'error': f'Service communication error: {str(e)}'}), 500

@orders_ns.route('/<int:id>')
@orders_ns.response(404, 'Order not found')
@orders_ns.param('id', 'The order identifier')
class OrderResource(Resource):
    @orders_ns.doc('get_order', security='Bearer Auth')
    @orders_ns.marshal_with(order_model)
    def get(self, id):
        """Get order by ID"""
        order = Order.query.get(id)
        if not order:
            return {'error': 'Order not found'}, 404
        return order.to_dict()

    @orders_ns.doc('update_order_status', security='Bearer Auth')
    @orders_ns.expect(api.model('OrderStatusUpdate', {'status': fields.String(required=True, enum=['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'])}))
    @orders_ns.marshal_with(order_model)
    def put(self, id):
        """Update order status by ID"""
        order = Order.query.get(id)
        if not order:
            return {'error': 'Order not found'}, 404

        data = request.get_json()
        new_status = data.get('status')
        if new_status not in ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED']:
            return {'error': 'Invalid status. Allowed: PENDING, PAID, FAILED, CANCELLED, REFUNDED'}, 400
        
        order.status = new_status
        db.session.commit()
        return order.to_dict()

    @orders_ns.doc('delete_order', security='Bearer Auth')
    @orders_ns.response(200, 'Order deleted successfully')
    def delete(self, id):
        """Delete order by ID"""
        order = Order.query.get(id)
        if not order:
            return {'error': 'Order not found'}, 404
        
        # Prevent deletion of paid orders as per Postman description
        if order.status == 'PAID':
            return {'error': 'Cannot delete a paid order. Please set status to CANCELLED or REFUNDED instead.'}, 400

        # Delete associated order items first
        OrderItem.query.filter_by(order_id=id).delete()
        db.session.delete(order)
        db.session.commit()
        return {'message': 'Order deleted successfully'}, 200

@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy', 'service': os.getenv('SERVICE_NAME')})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    port = Config.PORT
    app.run(host='0.0.0.0', port=port, debug=True)