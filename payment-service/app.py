from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_restx import Api, Resource, fields
from models import db, Transaction
from config import Config
import os
import requests

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
CORS(app)

api = Api(app, doc='/api-docs/', version='1.0',
          title='Payment Service API',
          description='API for processing payments',
          security='Bearer Auth',
          authorizations={
              'Bearer Auth': {
                  'type': 'apiKey',
                  'in': 'header',
                  'name': 'Authorization',
                  'description': 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"'
              }
          })

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

transaction_update_model = api.model('TransactionUpdate', {
    'status': fields.String(description='Transaction status (SUCCESS/FAILED/PENDING)')
})

internal_ns = api.namespace('internal', description='Internal service-to-service operations')

@payments_ns.route('/')
class TransactionList(Resource):
    @payments_ns.doc('list_transactions', security='Bearer Auth')
    @payments_ns.marshal_list_with(transaction_model)
    def get(self):
        """List all transactions"""
        return [t.to_dict() for t in Transaction.query.all()]

@payments_ns.route('/<int:id>')
@payments_ns.response(404, 'Transaction not found')
@payments_ns.param('id', 'The transaction identifier')
class TransactionResource(Resource):
    @payments_ns.doc('get_transaction', security='Bearer Auth')
    @payments_ns.marshal_with(transaction_model)
    def get(self, id):
        """Get transaction by ID"""
        transaction = Transaction.query.get(id)
        if not transaction:
            return {'error': 'Transaction not found'}, 404
        return transaction.to_dict()

    @payments_ns.doc('update_transaction', security='Bearer Auth')
    @payments_ns.expect(transaction_update_model)
    @payments_ns.marshal_with(transaction_model)
    def put(self, id):
        """
        Update transaction status (DEMO/TESTING ONLY)

        WARNING: In production, financial transactions should be IMMUTABLE.
        This endpoint is provided for testing/demo purposes only.
        Real-world: Use reversal/refund transactions instead of editing.
        """
        transaction = Transaction.query.get(id)
        if not transaction:
            return {'error': 'Transaction not found'}, 404

        data = request.get_json()

        if 'status' in data:
            allowed_statuses = ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED']
            if data['status'] in allowed_statuses:
                transaction.status = data['status']
            else:
                return {'error': f'Invalid status. Allowed: {allowed_statuses}'}, 400

        db.session.commit()
        return transaction.to_dict()

    @payments_ns.doc('delete_transaction', security='Bearer Auth')
    @payments_ns.response(200, 'Transaction deleted successfully')
    def delete(self, id):
        """
        Delete transaction (DEMO/TESTING ONLY)

        WARNING: In production, financial transactions should NEVER be deleted.
        This endpoint is provided for testing/demo purposes only.
        Real-world: Transactions must be kept for audit trail and compliance.
        """
        transaction = Transaction.query.get(id)
        if not transaction:
            return {'error': 'Transaction not found'}, 404

        db.session.delete(transaction)
        db.session.commit()
        return {'message': 'Transaction deleted successfully'}, 200

@internal_ns.route('/process')
class ProcessPaymentResource(Resource):
    @internal_ns.doc('process_payment', security='Bearer Auth')
    @internal_ns.expect(payment_input_model)
    @internal_ns.response(200, 'Payment processed successfully', transaction_model)
    @internal_ns.response(400, 'Payment failed (e.g., insufficient balance or invalid data)')
    @internal_ns.response(500, 'Failed to connect to dependent services (e.g., User Service)')
    def post(self):
        """
        Internal endpoint to process a payment.
        This is a CONSUMER endpoint. It calls the User Service.
        (Biasanya dipanggil oleh Order Service)
        """
        data = request.get_json()
        user_id = data.get('user_id')
        order_id = data.get('order_id')
        amount = data.get('amount')
        
        if not all([user_id, order_id, amount]):
            return {'error': 'Missing required fields: user_id, order_id, amount'}, 400

        new_transaction = Transaction(
            user_id=user_id,
            order_id=order_id,
            amount=amount,
            status='PENDING'
        )
        db.session.add(new_transaction)
        db.session.commit()

        try:
            balance_update_url = f"{Config.USER_SERVICE_URL}/internal/users/{user_id}/balance"
            payload = {'type': 'debit', 'amount': amount}
            
            response = requests.put(balance_update_url, json=payload, timeout=10)
            
            if response.status_code == 200:
                new_transaction.status = 'SUCCESS'
                db.session.commit()
                return new_transaction.to_dict(), 200
            else:
                error_msg = response.json().get('error', 'Payment failed')
                new_transaction.status = 'FAILED'
                db.session.commit()
                return {'error': error_msg}, 400

        except requests.exceptions.RequestException as e:
            new_transaction.status = 'FAILED'
            db.session.commit()
            return {'error': f'Failed to connect to User Service: {str(e)}'}, 500

@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy', 'service': os.getenv('SERVICE_NAME')})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    port = Config.PORT
    app.run(host='0.0.0.0', port=port, debug=True)