from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_restx import Api, Resource, fields
from models import db, User, bcrypt 
from config import Config
import os
import requests
import jwt 
from datetime import datetime, timedelta, timezone 
import time # Import modul time untuk sleep

# Fungsi untuk menunggu database siap
def wait_for_db(app, max_retries=10, delay=2):
    with app.app_context():
        for i in range(max_retries):
            try:
                db.session.execute(db.text('SELECT 1')).scalar()
                print("Database connection successful!")
                return
            except Exception as e:
                print(f"Database not ready, retrying in {delay}s... (Attempt {i+1}/{max_retries})")
                print(f"Error: {e}")
                time.sleep(delay)
        raise Exception("Failed to connect to the database after multiple retries.")


app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
db.init_app(app)
bcrypt.init_app(app) 
CORS(app)

# Initialize API documentation (Swagger)
api = Api(app, doc='/api-docs/', version='1.0',
          title='User Service API',
          description='API for managing users and balance')

# Define data models for documentation
user_model = api.model('User', {
    'id': fields.Integer(description='User ID'),
    'username': fields.String(description='Username'),
    'name': fields.String(description='User name'),
    'role': fields.String(description='User role'),
    'balance': fields.Float(description='User balance'),
})
user_input_model = api.model('UserInput', {
    'username': fields.String(required=True, description='Username'),
    'name': fields.String(description='User name'),
    'password': fields.String(required=True, description='User password')
})
balance_update_model = api.model('BalanceUpdate', {
    'amount': fields.Float(required=True, description='Amount to debit/credit'),
    'type': fields.String(required=True, description='Type: "credit" or "debit"')
})

users_ns = api.namespace('users', description='User operations')

@users_ns.route('/')
class UserList(Resource):
    @users_ns.doc('list_users')
    @users_ns.marshal_list_with(user_model)
    def get(self):
        """Get all users"""
        # --- Operasi yang sebelumnya mungkin hang ---
        users = User.query.all() 
        return [user.to_dict() for user in users]

    @users_ns.doc('create_user')
    @users_ns.expect(user_input_model)
    @users_ns.marshal_with(user_model, code=201)
    def post(self):
        """Create a new user"""
        data = request.get_json()
        if User.query.filter_by(username=data['username']).first():
            return {'error': 'Username already exists'}, 400
        
        user = User(
            username=data['username'],
            name=data.get('name', data['username'])
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        return user.to_dict(), 201

@users_ns.route('/<int:id>')
@users_ns.response(404, 'User not found')
@users_ns.param('id', 'The user identifier')
class UserResource(Resource):
    @users_ns.doc('get_user')
    @users_ns.marshal_with(user_model)
    def get(self, id):
        """Get user by ID"""
        user = User.query.get(id)
        if not user:
            return {'error': 'User not found'}, 404
        return user.to_dict()

# --- Endpoint Login (Sama) ---
auth_ns = api.namespace('auth', description='Authentication operations')
login_model = api.model('LoginInput', {
    'username': fields.String(required=True),
    'password': fields.String(required=True)
})

@auth_ns.route('/login')
class LoginResource(Resource):
    @auth_ns.doc('user_login')
    @auth_ns.expect(login_model)
    def post(self):
        """Logs in a user and returns a JWT token"""
        data = request.get_json()
        
        user = User.query.filter_by(username=data['username']).first()

        if user and user.check_password(data['password']):
            # Hitung waktu kadaluarsa (24 jam dari sekarang)
            expiration_time = datetime.now(timezone.utc) + timedelta(hours=24)
            
            # Buat payload token
            token_payload = {
                'id': user.id,
                'username': user.username,
                'role': user.role,
                'exp': int(expiration_time.timestamp()) 
            }
            
            token = jwt.encode(token_payload, Config.JWT_SECRET, algorithm='HS256')
            
            return {
                'success': True,
                'token': token,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'role': user.role
                }
            }, 200
        
        return {'error': 'Invalid credentials'}, 401

# --- Internal Endpoints (Sama) ---

@app.route('/internal/users/<int:user_id>')
def get_user_internal(user_id):
    """Internal endpoint for other services"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())

@app.route('/internal/users/<int:user_id>/balance', methods=['PUT'])
def update_user_balance(user_id):
    """Internal endpoint to update user balance (for PaymentService)"""
    data = request.get_json()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    amount = data.get('amount', 0)
    if data.get('type') == 'credit':
        user.balance += amount
    elif data.get('type') == 'debit':
        if user.balance < amount:
            return jsonify({'error': 'Insufficient balance'}), 400
        user.balance -= amount
    
    db.session.commit()
    return jsonify(user.to_dict())

# Health check (Sama)
@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy', 'service': os.getenv('SERVICE_NAME')})

if __name__ == '__main__':
    # --- Panggil wait_for_db sebelum create_all() ---
    wait_for_db(app) 
    
    with app.app_context():
        db.create_all() # Membuat tabel jika belum ada
        
        # Periksa dan buat user admin
        if not User.query.filter_by(username='admin').first():
            print("Admin user not found, creating one...")
            admin_user = User(
                username='admin',
                name='Admin User',
                role='admin',
                balance=999999
            )
            admin_user.set_password('admin123') 
            db.session.add(admin_user)
            db.session.commit()
            print("Admin user created.")

    port = Config.PORT
    app.run(host='0.0.0.0', port=port, debug=True)