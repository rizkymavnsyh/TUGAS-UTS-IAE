from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_bcrypt import Bcrypt

db = SQLAlchemy()
bcrypt = Bcrypt() # Inisialisasi Bcrypt

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    
    # Ganti 'email' menjadi 'username' agar sesuai frontend
    username = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=True) # Buat 'name' jadi opsional
    
    # Ganti 'password' menjadi 'password_hash'
    password_hash = db.Column(db.String(200), nullable=False)
    
    # Tambahkan 'role' yang dibutuhkan oleh API Gateway
    role = db.Column(db.String(20), nullable=False, default='user')
    
    balance = db.Column(db.Float, default=1000.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Fungsi baru untuk hashing password
    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    # Fungsi baru untuk mengecek password
    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'name': self.name,
            'role': self.role,
            'balance': self.balance,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }