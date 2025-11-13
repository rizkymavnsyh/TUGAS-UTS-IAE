import time
from app import app, db, wait_for_db
from models import User

workers = 2
worker_class = 'sync'
worker_connections = 1000
timeout = 120
keepalive = 5
graceful_timeout = 30

accesslog = '-'
errorlog = '-'
loglevel = 'debug'

def on_starting(server):
    print("--- [Gunicorn] Running DB Initializer for User Service ---")
    wait_for_db(app)
    with app.app_context():
        print("[Gunicorn] Creating all tables...")
        db.create_all()
        print("[Gunicorn] Checking for admin user...")
        if not User.query.filter_by(username='admin').first():
            print("[Gunicorn] Admin user not found, creating one...")
            admin_user = User(
                username='admin',
                name='Admin User',
                role='admin',
                balance=999999
            )
            admin_user.set_password('admin123')
            db.session.add(admin_user)
            db.session.commit()
            print("[Gunicorn] Admin user created.")
        else:
            print("[Gunicorn] Admin user already exists.")
    print("--- [Gunicorn] DB Initializer Complete ---")