import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///database.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PORT = int(os.getenv('PORT', 3001))
    SERVICE_NAME = os.getenv('SERVICE_NAME', 'user-service')
    # Penambahan yang diperlukan agar Flask dapat menemukan JWT_SECRET
    JWT_SECRET = os.getenv('JWT_SECRET', 'your-very-secret-jwt-key-change-in-production')
    # --- BARU: URL Order Service untuk CONSUMER check ---
    ORDER_SERVICE_URL = os.getenv('ORDER_SERVICE_URL', 'http://order-service:3003')
    # --- BCRYPT Configuration: Set to 10 untuk balance security & speed ---
    BCRYPT_LOG_ROUNDS = 10