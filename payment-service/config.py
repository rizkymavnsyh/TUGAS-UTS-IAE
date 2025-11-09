import os
from dotenv import load_dotenv
load_dotenv()
class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///database.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PORT = int(os.getenv('PORT', 3004))
    SERVICE_NAME = os.getenv('SERVICE_NAME', 'payment-service')
    # Ambil URL service lain
    USER_SERVICE_URL = os.getenv('USER_SERVICE_URL')