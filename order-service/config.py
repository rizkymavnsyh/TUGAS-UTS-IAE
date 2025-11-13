import os
from dotenv import load_dotenv
load_dotenv()
class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///database.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PORT = int(os.getenv('PORT', 3003))
    SERVICE_NAME = os.getenv('SERVICE_NAME', 'order-service')
    USER_SERVICE_URL = os.getenv('USER_SERVICE_URL')
    RESTAURANT_SERVICE_URL = os.getenv('RESTAURANT_SERVICE_URL')
    PAYMENT_SERVICE_URL = os.getenv('PAYMENT_SERVICE_URL')