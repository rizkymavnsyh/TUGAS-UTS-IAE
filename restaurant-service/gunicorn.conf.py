import time
from app import app, db, wait_for_db
from models import Restaurant, MenuItem

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
    print("--- [Gunicorn] Running DB Initializer for Restaurant Service ---")
    wait_for_db(app)

    with app.app_context():
        print("[Gunicorn] Creating all tables...")
        db.create_all()

        if not Restaurant.query.first():
            print("[Gunicorn] No restaurants found, creating sample data...")
            r1 = Restaurant(name='Pizza Zone', address='123 Main St')
            db.session.add(r1)
            db.session.commit()

            m1 = MenuItem(
                restaurant_id=r1.id,
                name='Pepperoni Pizza',
                description='Classic cheese and pepperoni',
                price=15.99
            )
            db.session.add(m1)
            db.session.commit()
            print("[Gunicorn] Sample data created.")
        else:
            print("[Gunicorn] Restaurant data already exists.")

    print("--- [Gunicorn] DB Initializer Complete ---")