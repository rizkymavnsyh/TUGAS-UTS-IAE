<<<<<<< HEAD
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs'); // Hapus bcrypt

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
=======
// =====================
// API Gateway (Express)
// =====================
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const axios = require('axios');

const app = express();
const PORT = 3000;
>>>>>>> 8d59c6b7edf52e10b0d566376c848d1fa11c0387

// Middleware
app.use(cors());
app.use(express.json());
<<<<<<< HEAD

// Service URLs (Menggunakan nama service dari Docker Compose)
const services = {
  userService: 'http://user-service:3001',
  restaurantService: 'http://restaurant-service:3002',
  orderService: 'http://order-service:3003',
  paymentService: 'http://payment-service:3004'
};

// --- HAPUS SELURUH 'const users = [...]' DARI SINI ---

// --- Tambahkan Proxy Publik BARU untuk Login ---
// Proxy auth requests (login) ke User Service.
// Ini adalah rute publik dan tidak memerlukan JWT.
app.use('/auth', createProxyMiddleware({
  target: services['userService'],
  changeOrigin: true,
  pathRewrite: {
    [`^/auth`]: '/auth' // Meneruskan /auth/login -> /auth/login
  }
}));
// --- Akhir Proxy Publik ---


// --- HAPUS ENDPOINT app.post('/auth/login', ...) DARI SINI ---

// --- HAPUS ENDPOINT app.post('/auth/register', ...) DARI SINI ---


// --- Middleware Otentikasi JWT (TETAP SAMA) ---
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  const token = authHeader.split(' ')[1]; // Bearer TOKEN
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// --- Role-based authorization (TETAP SAMA) ---
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

// --- Verify token endpoint (TETAP SAMA) ---
app.get('/auth/verify', authenticateJWT, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});


// Proxy middleware with JWT forwarding (TETAP SAMA)
const createAuthProxy = (service) => {
  return createProxyMiddleware({
    target: services[service],
    changeOrigin: true,
    pathRewrite: {
      [`^/api/${service.replace('Service', '').toLowerCase()}`]: '' // /api/user -> /
    },
    onProxyReq: (proxyReq, req, res) => {
      // Forward user info to backend services
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.id);
        proxyReq.setHeader('X-User-Role', req.user.role);
        proxyReq.setHeader('X-User-Username', req.user.username);
      }
    }
  });
};

// Protected routes (require authentication) (TETAP SAMA)
app.use('/api/user', authenticateJWT, createAuthProxy('userService'));
app.use('/api/restaurant', authenticateJWT, createAuthProxy('restaurantService'));
app.use('/api/order', authenticateJWT, createAuthProxy('orderService'));
app.use('/api/payment', authenticateJWT, createAuthProxy('paymentService'));

// Public health check route (TETAP SAMA)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: Object.keys(services)
  });
});

// Error handling (TETAP SAMA)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// (TETAP SAMA)
app.listen(PORT, () => {
  console.log(`API Gateway with JWT running on port ${PORT}`);
  console.log(`Login endpoint: http://localhost:${PORT}/auth/login`);
});
=======
app.use(morgan('dev'));

// Alamat service lain
const USER_SERVICE_URL = 'http://localhost:5001'; // ganti sesuai docker-compose kalau pakai Docker

// Route login
app.post('/auth/login', async (req, res) => {
  try {
    const response = await axios.post(`${USER_SERVICE_URL}/auth/login`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Error login gateway:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'User service not reachable' });
    }
  }
});

// Route default
app.get('/', (req, res) => {
  res.send('✅ API Gateway is running on port 3000');
});

// Jalankan server
app.listen(PORT, () => console.log(`🚀 API Gateway running at http://localhost:${PORT}`));
>>>>>>> 8d59c6b7edf52e10b0d566376c848d1fa11c0387
