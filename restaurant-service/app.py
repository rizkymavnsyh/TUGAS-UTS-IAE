from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_restx import Api, Resource, fields
from models import db, Restaurant, MenuItem
from config import Config
import os

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
CORS(app)

api = Api(app, doc='/api-docs/', version='1.0',
          title='Restaurant Service API',
          description='API for managing restaurants and menus')

# API Models
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

# --- Internal Endpoint for OrderService ---
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
    with app.app_context():
        db.create_all()
    port = Config.PORT
    app.run(host='0.0.0.0', port=port, debug=True)