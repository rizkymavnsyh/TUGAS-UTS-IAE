from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_restx import Api, Resource, fields
from models import db, Transaction
from config import Config
import os
import requests # Untuk memanggil service lain [cite: 915]

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
CORS(app)

api = Api(app, doc='/api-docs/', version='1.0',
          title='Payment Service API',
          description='API for processing payments')

# API Models
transaction_model = api.model('Transaction', {
    'id': fields.Integer,
    'user_id': fields.Integer,
    'order_id': fields.Integer,
    'amount': fields.Float,
    'status': fields.String,
    'created_at': fields.DateTime
})
payment_input_model = api.model('PaymentInput', {
    'user_id': fields.Integer(required=True),
    'order_id': fields.Integer(required=True),
    'amount': fields.Float(required=True)
})

payments_ns = api.namespace('payments', description='Payment operations')

@payments_ns.route('/')
class TransactionList(Resource):
    @payments_ns.marshal_list_with(transaction_model)
    def get(self):
        """List all transactions"""
        return [t.to_dict() for t in Transaction.query.all()]

# --- Internal Endpoint for OrderService ---
@app.route('/internal/process', methods=['POST'])
def process_payment():
    """
    Internal endpoint to process a payment.
    This is a CONSUMER endpoint[cite: 83]. It calls the User Service.
    """
    data = request.get_json()
    user_id = data.get('user_id')
    order_id = data.get('order_id')
    amount = data.get('amount')
    
    # 1. Buat transaksi PENDING
    new_transaction = Transaction(
        user_id=user_id,
        order_id=order_id,
        amount=amount,
        status='PENDING'
    )
    db.session.add(new_transaction)
    db.session.commit()

    try:
        # 2. Panggil User Service untuk mengurangi saldo
        balance_update_url = f"{Config.USER_SERVICE_URL}/internal/users/{user_id}/balance"
        payload = {'type': 'debit', 'amount': amount}
        
        response = requests.put(balance_update_url, json=payload)
        
        if response.status_code == 200:
            # 3. Jika berhasil, update status transaksi
            new_transaction.status = 'SUCCESS'
            db.session.commit()
            return jsonify(new_transaction.to_dict()), 200
        else:
            # 4. Jika gagal (misal: saldo tidak cukup [cite: 1062])
            error_msg = response.json().get('error', 'Payment failed')
            new_transaction.status = 'FAILED'
            db.session.commit()
            return jsonify({'error': error_msg}), 400

    except requests.exceptions.RequestException as e:
        # 5. Gagal konek ke User Service
        new_transaction.status = 'FAILED'
        db.session.commit()
        return jsonify({'error': f'Failed to connect to User Service: {str(e)}'}), 500

@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy', 'service': os.getenv('SERVICE_NAME')})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    port = Config.PORT
    app.run(host='0.0.0.0', port=port, debug=True)