# File baru: order-service/gunicorn.conf.py
import time
from app import app, db

# Worker configuration
workers = 2
worker_class = 'sync'
worker_connections = 1000
timeout = 120
keepalive = 5
graceful_timeout = 30

# Logging
accesslog = '-'
errorlog = '-'
loglevel = 'debug'

# Salin fungsi wait_for_db ke sini
def wait_for_db(app, max_retries=10, delay=2):
    with app.app_context():
        for i in range(max_retries):
            try:
                db.session.execute(db.text('SELECT 1')).scalar()
                print("Database connection successful!")
                return
            except Exception as e:
                print(f"Database not ready, retrying in {delay}s... (Attempt {i+1}/{max_retries})")
                time.sleep(delay)
        raise Exception("Failed to connect to the database after multiple retries.")

def on_starting(server):
    print("--- [Gunicorn] Running DB Initializer for Order Service ---")
    wait_for_db(app)
    with app.app_context():
        print("[Gunicorn] Creating all tables...")
        db.create_all()
    print("--- [Gunicorn] DB Initializer Complete ---")