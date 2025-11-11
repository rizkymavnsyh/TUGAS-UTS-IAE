from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_restx import Api, Resource, fields
from models import db, User, bcrypt
from config import Config
import os
import jwt
from datetime import datetime, timedelta, timezone
import time

# Fungsi untuk menunggu database siap
def wait_for_db(app, max_retries=10, delay=2):
    """Menunggu koneksi MySQL siap sebelum memulai aplikasi."""
    with app.app_context():
        for i in range(max_retries):
            try:
                # Mencoba query sederhana
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

# IMPORTANT: Init bcrypt dengan config yang sudah ada BCRYPT_LOG_ROUNDS=10
bcrypt.init_app(app)

CORS(app)

# Initialize API documentation (Swagger)
api = Api(app, doc='/api-docs/', version='1.0',
          title='User Service API',
          description='API for managing users and balance',
          security='Bearer Auth',
          authorizations={
              'Bearer Auth': {
                  'type': 'apiKey',
                  'in': 'header',
                  'name': 'Authorization',
                  'description': 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"'
              }
          })

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

users_ns = api.namespace('users', description='User operations')

@users_ns.route('/')
class UserList(Resource):
    @users_ns.doc('list_users', security='Bearer Auth')
    @users_ns.marshal_list_with(user_model)
    def get(self):
        """Get all users"""
        users = User.query.all() 
        return [user.to_dict() for user in users]

    @users_ns.doc('create_user', security='Bearer Auth')
    @users_ns.expect(user_input_model)
    @users_ns.marshal_with(user_model, code=201)
    def post(self):
        """Create a new user (Provider endpoint)"""
        data = request.get_json()
        if User.query.filter_by(username=data['username']).first():
            return {'error': 'Username already exists'}, 400
        
        user = User(
            username=data['username'],
            name=data.get('name', data['username'])
        )
        
        # PERBAIKAN 3: Kembalikan bcrypt (dummy hash dihapus)
        # Ini sekarang akan cepat karena BCRYPT_LOG_ROUNDS = 10
        user.set_password(data['password']) 

        db.session.add(user)
        db.session.commit()

        # PERBAIKAN 4: Hapus panggilan consumer ke order-service
        # Panggilan ini yang menyebabkan hang 30 detik kedua.
        # Jangan panggil service lain dari sini kecuali benar-benar dibutuhkan.
        
        return user.to_dict(), 201

@users_ns.route('/<int:id>')
@users_ns.response(404, 'User not found')
@users_ns.param('id', 'The user identifier')
class UserResource(Resource):
    @users_ns.doc('get_user', security='Bearer Auth')
    @users_ns.marshal_with(user_model)
    def get(self, id):
        """Get user by ID"""
        user = User.query.get(id)
        if not user:
            return {'error': 'User not found'}, 404
        return user.to_dict()

    @users_ns.doc('update_user', security='Bearer Auth')
    @users_ns.expect(user_input_model)
    @users_ns.marshal_with(user_model)
    def put(self, id):
        """Update user by ID"""
        user = User.query.get(id)
        if not user:
            return {'error': 'User not found'}, 404

        data = request.get_json()

        # Update username if provided and not duplicate
        if 'username' in data and data['username'] != user.username:
            existing = User.query.filter_by(username=data['username']).first()
            if existing:
                return {'error': 'Username already exists'}, 400
            user.username = data['username']

        # Update name if provided
        if 'name' in data:
            user.name = data['name']

        # Update password if provided
        if 'password' in data:
            user.set_password(data['password'])

        db.session.commit()
        return user.to_dict()

    @users_ns.doc('delete_user', security='Bearer Auth')
    @users_ns.response(200, 'User deleted successfully')
    def delete(self, id):
        """Delete user by ID"""
        user = User.query.get(id)
        if not user:
            return {'error': 'User not found'}, 404

        db.session.delete(user)
        db.session.commit()
        return {'message': 'User deleted successfully'}, 200

# --- Endpoint Login & Refresh ---
auth_ns = api.namespace('auth', description='Authentication operations')
login_model = api.model('LoginInput', {
    'username': fields.String(required=True),
    'password': fields.String(required=True)
})

# Helper function to decode JWT without expiration check
def decode_token_without_expiry(token):
    """Decode JWT token without verifying expiration"""
    try:
        return jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'], options={"verify_exp": False})
    except jwt.InvalidTokenError:
        return None

# Helper function to create access token
def create_access_token(user):
    """Create access token with 1 hour expiration"""
    expiration_time = datetime.now(timezone.utc) + timedelta(hours=1)
    token_payload = {
        'id': user.id,
        'username': user.username,
        'role': user.role,
        'exp': int(expiration_time.timestamp()),
        'type': 'access'
    }
    return jwt.encode(token_payload, Config.JWT_SECRET, algorithm='HS256')

# Helper function to create refresh token
def create_refresh_token(user):
    """Create refresh token with 7 days expiration"""
    expiration_time = datetime.now(timezone.utc) + timedelta(days=7)
    token_payload = {
        'id': user.id,
        'username': user.username,
        'role': user.role,
        'exp': int(expiration_time.timestamp()),
        'type': 'refresh'
    }
    return jwt.encode(token_payload, Config.JWT_SECRET, algorithm='HS256')

@auth_ns.route('/login')
class LoginResource(Resource):
    @auth_ns.doc('user_login')
    @auth_ns.expect(login_model)
    def post(self):
        """Logs in a user and returns access token and refresh token"""
        data = request.get_json()

        user = User.query.filter_by(username=data['username']).first()

        if user and user.check_password(data['password']):
            access_token = create_access_token(user)
            refresh_token = create_refresh_token(user)

            return {
                'success': True,
                'access_token': access_token,
                'refresh_token': refresh_token,
                'token': access_token,  # Untuk backward compatibility
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'role': user.role
                },
                'token_info': {
                    'access_token_expires_in': '1 hour',
                    'refresh_token_expires_in': '7 days'
                }
            }, 200

        return {'error': 'Invalid credentials'}, 401

@auth_ns.route('/refresh')
class RefreshTokenResource(Resource):
    @auth_ns.doc('refresh_token')
    @auth_ns.doc(params={'Authorization': {'in': 'header', 'description': 'Bearer <refresh_token>'}})
    def post(self):
        """Refresh access token using refresh token"""
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            return {'error': 'No refresh token provided'}, 401

        try:
            refresh_token = auth_header.split(' ')[1]
        except IndexError:
            return {'error': 'Invalid authorization header format'}, 401

        try:
            # Verify refresh token
            decoded = jwt.decode(refresh_token, Config.JWT_SECRET, algorithms=['HS256'])

            # Check if token type is refresh
            if decoded.get('type') != 'refresh':
                return {'error': 'Invalid token type. Expected refresh token'}, 401

            # Get user from database
            user = User.query.get(decoded['id'])
            if not user:
                return {'error': 'User not found'}, 404

            # Generate new access token
            new_access_token = create_access_token(user)

            return {
                'success': True,
                'access_token': new_access_token,
                'token': new_access_token,  # Untuk backward compatibility
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'role': user.role
                },
                'token_info': {
                    'access_token_expires_in': '1 hour'
                }
            }, 200

        except jwt.ExpiredSignatureError:
            return {'error': 'Refresh token has expired. Please login again'}, 401
        except jwt.InvalidTokenError:
            return {'error': 'Invalid refresh token'}, 401

# --- Internal Endpoints (API Provider untuk Service Lain) ---

@app.route('/internal/users/<int:user_id>')
def get_user_internal(user_id):
    """Internal endpoint for other services (Order/Payment) to get user details"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())

@app.route('/internal/users/<int:user_id>/balance', methods=['PUT'])
def update_user_balance(user_id):
    """Internal endpoint to update user balance (untuk PaymentService)"""
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

# Health check
@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy', 'service': os.getenv('SERVICE_NAME')})

# Jangan jalankan apapun di __main__
# Gunicorn akan menangani semuanya
if __name__ == '__main__':
    pass