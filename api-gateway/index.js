// =====================
// API Gateway (Express)
// =====================
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
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
