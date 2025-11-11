from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_restx import Api, Resource, fields
from models import db, Restaurant, MenuItem
from config import Config
import os
import time # Import modul time
import requests # Tambahkan import requests

# Fungsi untuk menunggu database siap (Sama seperti di user-service)
def wait_for_db(app, max_retries=10, delay=2):
    with app.app_context():
        for i in range(max_retries):
            try:
                # Mencoba query sederhana
                db.session.execute(db.text('SELECT 1')).scalar()
                print("Restaurant DB connection successful!")
                return
            except Exception as e:
                print(f"Restaurant DB not ready, retrying in {delay}s... (Attempt {i+1}/{max_retries})")
                time.sleep(delay)
        raise Exception("Failed to connect to the Restaurant database after multiple retries.")


app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
CORS(app)

api = Api(app, doc='/api-docs/', version='1.0',
          title='Restaurant Service API',
          description='API for managing restaurants and menus')

# API Models (TETAP SAMA)
restaurant_model = api.model('Restaurant', {
    'id': fields.Integer,
    'name': fields.String,
    'address': fields.String
})
menu_item_model = api.model('MenuItem', {
    'id': fields.Integer,
    'restaurant_id': fields.Integer,
    'name': fields.String,
    'description': fields.String,
    'price': fields.Float
})
menu_item_input_model = api.model('MenuItemInput', {
    'name': fields.String(required=True),
    'description': fields.String,
    'price': fields.Float(required=True)
})

restaurants_ns = api.namespace('restaurants', description='Restaurant operations')

@restaurants_ns.route('/')
class RestaurantList(Resource):
    @restaurants_ns.marshal_list_with(restaurant_model)
    def get(self):
        """List all restaurants"""
        return [r.to_dict() for r in Restaurant.query.all()]

    @restaurants_ns.expect(restaurant_model)
    @restaurants_ns.marshal_with(restaurant_model, code=201)
    def post(self):
        """Create a new restaurant"""
        data = request.get_json()
        r = Restaurant(name=data['name'], address=data['address'])
        db.session.add(r)
        db.session.commit()
        return r.to_dict(), 201

@restaurants_ns.route('/<int:id>')
@restaurants_ns.response(404, 'Restaurant not found')
@restaurants_ns.param('id', 'The restaurant identifier')
class RestaurantResource(Resource):
    @restaurants_ns.marshal_with(restaurant_model)
    def get(self, id):
        """Get restaurant by ID"""
        restaurant = Restaurant.query.get(id)
        if not restaurant:
            return {'error': 'Restaurant not found'}, 404
        return restaurant.to_dict()

    @restaurants_ns.expect(restaurant_model)
    @restaurants_ns.marshal_with(restaurant_model)
    def put(self, id):
        """Update restaurant by ID"""
        restaurant = Restaurant.query.get(id)
        if not restaurant:
            return {'error': 'Restaurant not found'}, 404

        data = request.get_json()
        if 'name' in data:
            restaurant.name = data['name']
        if 'address' in data:
            restaurant.address = data['address']

        db.session.commit()
        return restaurant.to_dict()

    @restaurants_ns.response(204, 'Restaurant deleted')
    def delete(self, id):
        """Delete restaurant by ID"""
        restaurant = Restaurant.query.get(id)
        if not restaurant:
            return {'error': 'Restaurant not found'}, 404

        # Also delete all menu items for this restaurant
        MenuItem.query.filter_by(restaurant_id=id).delete()
        db.session.delete(restaurant)
        db.session.commit()
        return '', 204

@restaurants_ns.route('/<int:id>/menu')
@restaurants_ns.param('id', 'The restaurant identifier')
class RestaurantMenu(Resource):
    @restaurants_ns.marshal_list_with(menu_item_model)
    def get(self, id):
        """Get all menu items for a restaurant"""
        items = MenuItem.query.filter_by(restaurant_id=id).all()
        return [item.to_dict() for item in items]

    @restaurants_ns.expect(menu_item_input_model)
    @restaurants_ns.marshal_with(menu_item_model, code=201)
    def post(self, id):
        """Create a new menu item for a restaurant"""
        data = request.get_json()
        item = MenuItem(
            restaurant_id=id,
            name=data['name'],
            description=data.get('description'),
            price=data['price']
        )
        db.session.add(item)
        db.session.commit()
        return item.to_dict(), 201

@restaurants_ns.route('/<int:restaurant_id>/menu/<int:menu_id>')
@restaurants_ns.param('restaurant_id', 'The restaurant identifier')
@restaurants_ns.param('menu_id', 'The menu item identifier')
@restaurants_ns.response(404, 'Menu item not found')
class MenuItemResource(Resource):
    @restaurants_ns.marshal_with(menu_item_model)
    def get(self, restaurant_id, menu_id):
        """Get specific menu item"""
        item = MenuItem.query.filter_by(id=menu_id, restaurant_id=restaurant_id).first()
        if not item:
            return {'error': 'Menu item not found'}, 404
        return item.to_dict()

    @restaurants_ns.expect(menu_item_input_model)
    @restaurants_ns.marshal_with(menu_item_model)
    def put(self, restaurant_id, menu_id):
        """Update menu item"""
        item = MenuItem.query.filter_by(id=menu_id, restaurant_id=restaurant_id).first()
        if not item:
            return {'error': 'Menu item not found'}, 404

        data = request.get_json()
        if 'name' in data:
            item.name = data['name']
        if 'description' in data:
            item.description = data['description']
        if 'price' in data:
            item.price = data['price']

        db.session.commit()
        return item.to_dict()

    @restaurants_ns.response(204, 'Menu item deleted')
    def delete(self, restaurant_id, menu_id):
        """Delete menu item"""
        item = MenuItem.query.filter_by(id=menu_id, restaurant_id=restaurant_id).first()
        if not item:
            return {'error': 'Menu item not found'}, 404

        db.session.delete(item)
        db.session.commit()
        return '', 204

# --- Internal Endpoint for OrderService (TETAP SAMA) ---
@app.route('/internal/menu-items/<int:item_id>')
def get_menu_item_internal(item_id):
    """Internal endpoint to get menu item details"""
    item = MenuItem.query.get(item_id)
    if not item:
        return jsonify({'error': 'Menu item not found'}), 404
    return jsonify(item.to_dict())

@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy', 'service': os.getenv('SERVICE_NAME')})

if __name__ == '__main__':
    # --- PANGGIL WAIT_FOR_DB DULU ---
    wait_for_db(app) 
    
    with app.app_context():
        db.create_all()
        
        # --- LOGIKA INISIALISASI DATA SAMPLE KRITIS ---
        if not Restaurant.query.first():
            print("No restaurants found, creating sample data...")
            
            # --- START LOGIKA CONSUMER: Memanggil User Service untuk memverifikasi admin user (ID 1) ---
            try:
                # User Service memiliki internal endpoint untuk mendapatkan user berdasarkan ID
                user_url = f"{Config.USER_SERVICE_URL}/internal/users/1"
                user_res = requests.get(user_url)
                
                if user_res.status_code == 200:
                    admin_name = user_res.json().get('username')
                    print(f"[CONSUMER-RESTAURANT] Verified Admin User exists: {admin_name}")
                else:
                    print(f"[CONSUMER-RESTAURANT] Warning: Admin User (ID 1) not found in User Service (Code: {user_res.status_code}).")
            except requests.exceptions.RequestException as e:
                # Ini hanya log, tidak mengganggu inisialisasi (non-critical path)
                print(f"[CONSUMER-RESTAURANT] Warning: Failed to connect to User Service: {str(e)}")
            # --- END LOGIKA CONSUMER ---
            
            # 1. Buat Restaurant (ID: 1)
            r1 = Restaurant(name='Pizza Zone', address='123 Main St')
            db.session.add(r1)
            db.session.commit() 

            # 2. Buat Menu Item (ID: 1)
            m1 = MenuItem(
                restaurant_id=r1.id, 
                name='Pepperoni Pizza', 
                description='Classic cheese and pepperoni', 
                price=15.99
            )
            db.session.add(m1)
            db.session.commit()

            print(f"Sample restaurant created. Use menu_item_id: {m1.id} for testing.")
        # --- END LOGIKA INISIALISASI ---
        
    port = Config.PORT
    app.run(host='0.0.0.0', port=port, debug=True)