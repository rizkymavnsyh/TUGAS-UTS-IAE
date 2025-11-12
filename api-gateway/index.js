const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const PROXY_TIMEOUT = 90000;

app.use(cors({
    origin: '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));
app.use(express.json());

const services = {
  userService: 'http://user-service:3001',
  restaurantService: 'http://restaurant-service:3002',
  orderService: 'http://order-service:3003',
  paymentService: 'http://payment-service:3004'
};

app.use('/auth', createProxyMiddleware({
  target: services['userService'],
  changeOrigin: true,
  timeout: PROXY_TIMEOUT, 
  proxyTimeout: PROXY_TIMEOUT, 
  pathRewrite: {
    [`^/auth`]: '/auth'
  },
  onProxyReq: (proxyReq, req, res) => {
    if (req.method === 'POST' && req.body) {
        let bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        proxyReq.end();
    }
  },
  onError: (err, req, res, target) => {
    console.error(`[API GATEWAY ERROR] Proxy Error for ${req.path} to ${target.href}:`, err);
    res.status(504).json({
      success: false,
      error: 'Gateway Timeout (504) or connection error with backend service.'
    });
  }
}));

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.',
        required_role: roles,
        your_role: req.user.role
      });
    }

    next();
  };
};

const adminOnlyForMutations = (req, res, next) => {
  const method = req.method;

  if (method === 'GET') {
    return next();
  }

  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied. Admin role required for this operation.',
        operation: method,
        your_role: req.user.role,
        required_role: 'admin'
      });
    }
  }

  next();
};

const createAuthProxy = (service) => {
  return createProxyMiddleware({
    target: services[service],
    changeOrigin: true,
    timeout: PROXY_TIMEOUT,
    proxyTimeout: PROXY_TIMEOUT,
    pathRewrite: {
      [`^/api/${service.replace('Service', '').toLowerCase()}`]: ''
    },
    onProxyReq: (proxyReq, req, res) => {
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.id);
        proxyReq.setHeader('X-User-Role', req.user.role);
        proxyReq.setHeader('X-User-Username', req.user.username);
      }

      if ((req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') && req.body) {
        let bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        proxyReq.end();
      }
    },
    onError: (err, req, res, target) => {
      console.error(`[API GATEWAY ERROR] Protected Proxy Error for ${req.path} to ${target.href}:`, err);
      res.status(504).json({
        success: false,
        error: 'Gateway Timeout or connection refused by backend service.'
      });
    }
  });
};

app.use('/api/user', authenticateJWT, adminOnlyForMutations, createAuthProxy('userService'));
app.use('/api/restaurant', authenticateJWT, adminOnlyForMutations, createAuthProxy('restaurantService'));
app.use('/api/order', authenticateJWT, adminOnlyForMutations, createAuthProxy('orderService'));
app.use('/api/payment', authenticateJWT, adminOnlyForMutations, createAuthProxy('paymentService'));

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: Object.keys(services)
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway with JWT running on port ${PORT}`);
  console.log(`Login endpoint: http://localhost:${PORT}/auth/login`);
});