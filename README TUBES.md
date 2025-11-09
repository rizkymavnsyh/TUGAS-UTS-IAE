# Project Requirement — UTS

## Mata Kuliah:IAE/EAI
---

## 1. Latar Belakang

Di era digital saat ini, banyak aplikasi tidak lagi berdiri sendiri, melainkan saling terhubung melalui Application Programming Interface (API). API memungkinkan sistem berbeda untuk bertukar data dan fungsi, seperti sistem pembayaran, layanan e-commerce, transportasi online, hingga aplikasi kesehatan digital. Untuk memastikan komunikasi antar sistem berjalan baik dan terdokumentasi dengan jelas, digunakan Postman/Swagger (OpenAPI) sebagai alat dokumentasi API.

---

## 2. Tujuan Proyek

Mahasiswa diharapkan mampu:

1. **Membangun minimal layanan sebanyak jumlah anggota kelompok** (minimal 2 layanan) yang dapat berkomunikasi melalui API (Masing-masing berperan sebagai provider, dan Consumer)
2. **Service as Provider**: Penyedia API
   - Contohnya: user-service
   - Menyediakan endpoint seperti `/users`, `/users/:id`, dsb.
   - Format data: JSON
   - Komunikasi via HTTP (GET, POST, PUT, DELETE)
3. **Consumer**: Untuk consumer, cukup menggunakan frontend sederhana (bisa menggunakan React, Vue, atau HTML + JS biasa). Frontend ini nanti:
   - Memanggil API Gateway,
   - Menampilkan data dari dua layanan.
   - Misalnya:
     - Halaman "Users" ambil data dari REST API Users
4. **Komunikasi melalui 1 API Gateway**
5. **Mengimplementasikan REST API dengan format JSON.**
6. **Membuat dokumentasi API menggunakan Swagger / OpenAPI Specification ATAU Postman.**
7. **Memahami konsep service integration antar sistem secara sederhana.**

---

## 3. Deskripsi Proyek

Mahasiswa diminta membuat dua atau lebih layanan yang saling berkomunikasi menggunakan API. Setiap layanan harus memiliki endpoint sendiri dan saling bertukar data menggunakan protokol HTTP. Dokumentasi API wajib dibuat dan dapat diakses melalui Swagger UI.

---

## 4. Contoh Tema/Topik Pilihan (pilih salah satu atau kembangkan)

| No | Topik | Deskripsi Singkat |
|----|-------|-------------------|
| 1 | **Digital Payment Service (E-Wallet)** | Layanan pengguna dan transaksi saling berkomunikasi; misalnya user-service dan payment-service. |
| 2 | **Smart Healthcare System** | Layanan pasien dan layanan rekam medis terhubung via API untuk pendaftaran dan pengecekan riwayat. |
| 3 | **Online Learning Platform (EduConnect)** | Layanan siswa, kursus, dan nilai saling berkomunikasi (misal: course-service dan student-service). |
| 4 | **Public Transportation Tracker** | Layanan kendaraan dan jadwal terhubung; misal bus-service dan route-service. |
| 5 | **Food Delivery System** | Layanan restoran, pelanggan, dan pesanan saling terhubung menggunakan REST API. |

---

## 5. Spesifikasi Teknis Minimal

| Komponen | Keterangan |
|----------|------------|
| **Arsitektur** | Minimal **layanan sebanyak jumlah anggota kelompok** (minimal 2) REST API yang saling berkomunikasi (misal: User Service ↔ Order Service) |
| **Format Data** | JSON |
| **Dokumentasi** | Menggunakan Swagger / OpenAPI ATAU Postman |
| **Framework Backend** | Boleh menggunakan Node.js (Express), Flask, Spring Boot, Laravel, atau lainnya |
| **Database** | MySQL / MongoDB / PostgreSQL / SQLite (pilih salah satu) |
| **Testing Tools** | Postman atau Swagger UI |
| **Integrasi API** | Salah satu service melakukan API call ke service lain |
| **API Gateway** | Wajib menggunakan 1 API Gateway sebagai pintu masuk komunikasi |

---

## 6. Arsitektur Sistem

### Diagram Arsitektur Umum

```mermaid
graph TB
    Client[Frontend Client] --> Gateway[API Gateway]
    
    Gateway --> Service1[Service 1<br/>Provider & Consumer]
    Gateway --> Service2[Service 2<br/>Provider & Consumer]
    Gateway --> Service3[Service 3<br/>Provider & Consumer]
    Gateway --> Service4[Service 4<br/>Provider & Consumer]
    
    Service1 -.->|HTTP Request/Response| Service2
    Service2 -.->|HTTP Request/Response| Service3
    Service3 -.->|HTTP Request/Response| Service4
    Service4 -.->|HTTP Request/Response| Service1
    
    subgraph ServiceLayer [Service Layer]
        Service1
        Service2
        Service3
        Service4
    end
    
    subgraph DataLayer [Data Layer]
        DB1[(Database 1)]
        DB2[(Database 2)]
        DB3[(Database 3)]
        DB4[(Database 4)]
    end
    
    Service1 --> DB1
    Service2 --> DB2
    Service3 --> DB3
    Service4 --> DB4
```

### Contoh Alur Komunikasi: E-Commerce

```mermaid
sequenceDiagram
    participant Client as Frontend Client
    participant Gateway as API Gateway
    participant OrderService as Order Service
    participant UserService as User Service
    participant ProductService as Product Service
    participant NotificationService as Notification Service
    
    Client->>Gateway: POST /orders
    Gateway->>OrderService: Forward request
    
    OrderService->>UserService: GET /users/{id}
    UserService-->>OrderService: User data
    
    OrderService->>ProductService: GET /products/{id}
    ProductService-->>OrderService: Product data
    
    OrderService->>ProductService: PUT /products/{id}/stock
    ProductService-->>OrderService: Updated stock
    
    OrderService->>NotificationService: POST /notifications
    NotificationService-->>OrderService: Notification sent
    
    OrderService-->>Gateway: Order response
    Gateway-->>Client: Order confirmation
```

---

## 7. Contoh Implementasi API

### Digital Payment Service (E-Wallet)

#### User Service (Provider)

```javascript
// Provider Endpoints
GET    /users              - Mendapatkan semua user
GET    /users/{id}         - Mendapatkan user berdasarkan ID
POST   /users              - Membuat user baru
PUT    /users/{id}         - Update data user
DELETE /users/{id}         - Hapus user
GET    /users/{id}/balance - Mendapatkan saldo user
```

#### Payment Service (Provider & Consumer)

```javascript
// Provider Endpoints
GET    /transactions       - Mendapatkan semua transaksi
GET    /transactions/{id}  - Mendapatkan transaksi berdasarkan ID
POST   /transactions       - Membuat transaksi baru
PUT    /transactions/{id}  - Update status transaksi

// Consumer Endpoints
GET    /internal/users/{id}      - Mengambil data user dari UserService
PUT    /internal/users/{id}/balance - Update saldo user
```

### Smart Healthcare System

#### Patient Service (Provider)

```javascript
GET    /patients           - Mendapatkan semua pasien
GET    /patients/{id}      - Mendapatkan pasien berdasarkan ID
POST   /patients           - Mendaftarkan pasien baru
PUT    /patients/{id}      - Update data pasien
GET    /patients/{id}/records - Mendapatkan rekam medis pasien
```

#### Medical Record Service (Provider & Consumer)

```javascript
// Provider Endpoints
GET    /medical-records    - Mendapatkan semua rekam medis
GET    /medical-records/{id} - Mendapatkan rekam medis berdasarkan ID
POST   /medical-records    - Membuat rekam medis baru
PUT    /medical-records/{id} - Update rekam medis

// Consumer Endpoints
GET    /internal/patients/{id}   - Mengambil data pasien dari PatientService
POST   /internal/patients/{id}/records - Menambah rekam medis ke pasien
```

---

## 8. Implementasi API Gateway

### Contoh Implementasi dengan Node.js/Express

#### Implementasi Dasar (Tanpa Autentikasi)

```javascript
const express = require('express');
const httpProxy = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Service URLs
const services = {
  userService: 'http://localhost:3001',
  paymentService: 'http://localhost:3002',
  patientService: 'http://localhost:3003',
  medicalRecordService: 'http://localhost:3004'
};

// Proxy middleware
const proxy = (service) => {
  return httpProxy.createProxyMiddleware({
    target: services[service],
    changeOrigin: true,
    pathRewrite: {
      [`^/api/${service}`]: ''
    }
  });
};

// Routes
app.use('/api/user-service', proxy('userService'));
app.use('/api/payment-service', proxy('paymentService'));
app.use('/api/patient-service', proxy('patientService'));
app.use('/api/medical-record-service', proxy('medicalRecordService'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: Object.keys(services)
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
```

#### Implementasi dengan JWT Authentication (Recommended)

```javascript
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Service URLs
const services = {
  userService: 'http://localhost:3001',
  paymentService: 'http://localhost:3002',
  patientService: 'http://localhost:3003',
  medicalRecordService: 'http://localhost:3004'
};

// Dummy user database (in production, use real database)
const users = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$10$rqFz8K7W7W7W7W7W7W7W7.W7W7W7W7W7W7W7W7W7W7W7W7W7W7', // 'admin123'
    role: 'admin'
  }
];

// JWT Authentication Middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ 
      error: 'Access denied. No token provided.' 
    });
  }

  const token = authHeader.split(' ')[1]; // Bearer TOKEN

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ 
      error: 'Invalid or expired token.' 
    });
  }
};

// Optional: Role-based authorization middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
};

// Login endpoint
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ 
      error: 'Username and password are required' 
    });
  }

  // Find user
  const user = users.find(u => u.username === username);
  
  if (!user) {
    return res.status(401).json({ 
      error: 'Invalid credentials' 
    });
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, user.password);
  
  if (!validPassword) {
    return res.status(401).json({ 
      error: 'Invalid credentials' 
    });
  }

  // Generate JWT token
  const token = jwt.sign(
    { 
      id: user.id, 
      username: user.username,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    token: token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  });
});

// Register endpoint (optional)
app.post('/auth/register', async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password) {
    return res.status(400).json({ 
      error: 'Username and password are required' 
    });
  }

  // Check if user already exists
  const existingUser = users.find(u => u.username === username);
  
  if (existingUser) {
    return res.status(400).json({ 
      error: 'Username already exists' 
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const newUser = {
    id: users.length + 1,
    username,
    password: hashedPassword,
    email,
    role: 'user'
  };

  users.push(newUser);

  // Generate token
  const token = jwt.sign(
    { 
      id: newUser.id, 
      username: newUser.username,
      role: newUser.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(201).json({
    success: true,
    token: token,
    user: {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role
    }
  });
});

// Verify token endpoint
app.get('/auth/verify', authenticateJWT, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Refresh token endpoint
app.post('/auth/refresh', authenticateJWT, (req, res) => {
  const newToken = jwt.sign(
    { 
      id: req.user.id, 
      username: req.user.username,
      role: req.user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    token: newToken
  });
});

// Proxy middleware with JWT forwarding
const createAuthProxy = (service) => {
  return createProxyMiddleware({
    target: services[service],
    changeOrigin: true,
    pathRewrite: {
      [`^/api/${service}`]: ''
    },
    onProxyReq: (proxyReq, req, res) => {
      // Forward JWT token to backend services
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.id);
        proxyReq.setHeader('X-User-Role', req.user.role);
        proxyReq.setHeader('X-User-Username', req.user.username);
      }
    }
  });
};

// Protected routes (require authentication)
app.use('/api/user-service', authenticateJWT, createAuthProxy('userService'));
app.use('/api/payment-service', authenticateJWT, createAuthProxy('paymentService'));
app.use('/api/patient-service', authenticateJWT, createAuthProxy('patientService'));
app.use('/api/medical-record-service', authenticateJWT, createAuthProxy('medicalRecordService'));

// Public routes (no authentication required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: Object.keys(services)
  });
});

// Error handling middleware
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
```

#### Package.json untuk API Gateway dengan JWT

```json
{
  "name": "api-gateway",
  "version": "1.0.0",
  "description": "API Gateway with JWT Authentication",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "http-proxy-middleware": "^2.0.6",
    "cors": "^2.8.5",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

#### .env untuk API Gateway

```bash
PORT=3000
JWT_SECRET=your-very-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=24h
NODE_ENV=development

# Service URLs
USER_SERVICE_URL=http://localhost:3001
PAYMENT_SERVICE_URL=http://localhost:3002
PATIENT_SERVICE_URL=http://localhost:3003
MEDICAL_RECORD_SERVICE_URL=http://localhost:3004
```

#### Cara Menggunakan JWT dari Frontend

```javascript
// Login
const login = async (username, password) => {
  try {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    
    if (data.success) {
      // Save token to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Make authenticated request
const getUsers = async () => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch('http://localhost:3000/api/user-service/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
};

// Logout
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
};
```

#### Contoh HTML Login Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - API Gateway</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .login-container {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
        }
        h2 {
            text-align: center;
            color: #333;
            margin-bottom: 1.5rem;
        }
        .form-group {
            margin-bottom: 1rem;
        }
        label {
            display: block;
            margin-bottom: 0.5rem;
            color: #555;
        }
        input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 1rem;
            box-sizing: border-box;
        }
        button {
            width: 100%;
            padding: 0.75rem;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.3s;
        }
        button:hover {
            background: #5568d3;
        }
        .error {
            color: red;
            text-align: center;
            margin-top: 1rem;
        }
        .success {
            color: green;
            text-align: center;
            margin-top: 1rem;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <h2>Login</h2>
        <form id="loginForm">
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit">Login</button>
            <div id="message"></div>
        </form>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const messageDiv = document.getElementById('message');

            try {
                const response = await fetch('http://localhost:3000/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (data.success) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    messageDiv.className = 'success';
                    messageDiv.textContent = 'Login successful! Redirecting...';
                    
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                } else {
                    messageDiv.className = 'error';
                    messageDiv.textContent = data.error || 'Login failed';
                }
            } catch (error) {
                messageDiv.className = 'error';
                messageDiv.textContent = 'Connection error. Please try again.';
            }
        });
    </script>
</body>
</html>
```

---

## 9. Dokumentasi API

### Opsi 1: Dokumentasi dengan Swagger/OpenAPI

#### Contoh Konfigurasi Swagger dengan Node.js

```javascript
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Service API',
      version: '1.0.0',
      description: 'API documentation for User Service',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
```

#### Contoh Dokumentasi Endpoint

```javascript
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retrieve a list of users
 *     description: Retrieve a list of all users from the database
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The user ID
 *                   name:
 *                     type: string
 *                     description: The user name
 *                   email:
 *                     type: string
 *                     description: The user email
 */
```

### Opsi 2: Dokumentasi dengan Postman

#### Membuat Koleksi Postman

1. **Install Postman Desktop** atau gunakan versi web
2. **Buat Workspace baru** untuk proyek Anda
3. **Create Collection** untuk setiap service

#### Struktur Koleksi Postman

```
UTS EAI Project Workspace
├── User Service Collection
│   ├── GET /users
│   ├── GET /users/{id}
│   ├── POST /users
│   ├── PUT /users/{id}
│   └── DELETE /users/{id}
├── Payment Service Collection
│   ├── GET /transactions
│   ├── GET /transactions/{id}
│   ├── POST /transactions
│   └── PUT /transactions/{id}
└── API Gateway Collection
    ├── GET /api/user-service/users
    ├── POST /api/payment-service/transactions
    └── GET /health
```

#### Contoh Konfigurasi Request di Postman

**GET /users Request:**

```json
{
  "info": {
    "name": "Get All Users",
    "description": "Retrieve a list of all users"
  },
  "request": {
    "method": "GET",
    "header": [],
    "url": {
      "raw": "http://localhost:3001/users",
      "protocol": "http",
      "host": ["localhost"],
      "port": "3001",
      "path": ["users"]
    }
  },
  "response": []
}
```

**POST /users Request:**

```json
{
  "info": {
    "name": "Create User",
    "description": "Create a new user"
  },
  "request": {
    "method": "POST",
    "header": [
      {
        "key": "Content-Type",
        "value": "application/json"
      }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\n  \"name\": \"John Doe\",\n  \"email\": \"john@example.com\",\n  \"password\": \"password123\"\n}"
    },
    "url": {
      "raw": "http://localhost:3001/users",
      "protocol": "http",
      "host": ["localhost"],
      "port": "3001",
      "path": ["users"]
    }
  }
}
```

#### Environment Variables di Postman

1. **Create Environment** untuk development dan production
2. **Set variables** untuk base URL dan konfigurasi lainnya

```json
{
  "name": "Development Environment",
  "values": [
    {
      "key": "base_url",
      "value": "http://localhost:3000",
      "enabled": true
    },
    {
      "key": "user_service_url",
      "value": "http://localhost:3001",
      "enabled": true
    },
    {
      "key": "payment_service_url",
      "value": "http://localhost:3002",
      "enabled": true
    },
    {
      "key": "api_key",
      "value": "your-api-key-here",
      "enabled": true
    }
  ]
}
```

#### Menggunakan Variables di Request

```json
{
  "request": {
    "method": "GET",
    "header": [
      {
        "key": "X-API-Key",
        "value": "{{api_key}}"
      }
    ],
    "url": {
      "raw": "{{user_service_url}}/users",
      "host": ["{{user_service_url}}"],
      "path": ["users"]
    }
  }
}
```

#### Automated Testing dengan Postman

**Test Script untuk GET /users:**

```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has users array", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('data');
    pm.expect(jsonData.data).to.be.an('array');
});

pm.test("Each user has required fields", function () {
    const jsonData = pm.response.json();
    jsonData.data.forEach(user => {
        pm.expect(user).to.have.property('id');
        pm.expect(user).to.have.property('name');
        pm.expect(user).to.have.property('email');
    });
});
```

**Pre-request Script untuk Authentication:**

```javascript
// Generate token if needed
if (!pm.environment.get("auth_token")) {
    const loginRequest = {
        url: pm.environment.get("base_url") + "/auth/login",
        method: "POST",
        header: "Content-Type: application/json",
        body: {
            mode: "raw",
            raw: JSON.stringify({
                email: "test@example.com",
                password: "password123"
            })
        }
    };
    
    pm.sendRequest(loginRequest, function (err, res) {
        if (err) {
            console.log(err);
        } else {
            const token = res.json().token;
            pm.environment.set("auth_token", token);
        }
    });
}
```

#### Export dan Share Koleksi Postman

1. **Export Collection**: Klik kanan pada collection → Export
2. **Pilih format**: JSON v2.1 (recommended)
3. **Share dengan tim**:
   - Generate share link
   - Invite team members ke workspace
   - Export dan kirim file JSON

#### Dokumentasi yang Harus Dikumpulkan

**Untuk Postman:**

- File export collection (.json)
- File export environment (.json)
- Screenshot dari Postman workspace
- Dokumentasi endpoint dalam bentuk README.md

**Format README.md untuk Postman Collection:**

```markdown
# API Documentation - User Service

## Base URL

http://localhost:3001

## Authentication

Tambahkan header `X-API-Key: your-api-key` untuk semua request.

## Endpoints

### Get All Users

- **Method**: GET
- **URL**: `/users`
- **Description**: Retrieve a list of all users
- **Response Example**:

{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2023-12-01T10:30:00Z"
    }
  ]
}

### Create User

- **Method**: POST
- **URL**: `/users`
- **Headers**: `Content-Type: application/json`
- **Body**:

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

- **Response Example**:

{
  "success": true,
  "data": {
    "id": 2,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2023-12-01T10:30:00Z"
  }
}
```

---

## 10. Output yang Diharapkan

1. **Aplikasi API berjalan dan bisa saling berkomunikasi.**
2. **Dokumentasi API lengkap (Swagger/OpenAPI ATAU Postman).**
3. **File dokumentasi (.json/.yaml untuk OpenAPI atau .json untuk Postman) disertakan.**
4. **Frontend sederhana yang dapat mengkonsumsi API Gateway.**
5. **Source code lengkap dengan dokumentasi setup dan running.**

---

## 11. Waktu Pengerjaan

- **Diberikan selama 2 minggu**
- **Presentasi & demo sistem dilakukan saat minggu UTS.**

---

## 12. Kriteria Penilaian

| Komponen | Bobot |
|----------|-------|
| Arsitektur layanan dan komunikasi API | 30% |
| Fungsionalitas sistem (berjalan dengan baik) | 25% |
| Dokumentasi API (Swagger) | 20% |
| Presentasi & pemahaman konsep | 25% |

---

## 13. Rubrikasi Penilaian

| Komponen Penilaian | Bobot | Level Rendah (Low) | Level Sedang (Medium) | Level Tinggi (High) |
|--------------------|-------|---------------------|----------------------|---------------------|
| **1. Arsitektur Layanan dan Komunikasi API** | 30% | Hanya terdapat 2 layanan sederhana, belum ada komunikasi antar layanan atau API masih bersifat statis. | Terdapat dua layanan yang saling berkomunikasi melalui API, tetapi masih ada kendala dalam alur integrasi atau struktur arsitektur belum sepenuhnya jelas. | Arsitektur sistem terstruktur dan jelas, terdapat lebih dari dua layanan saling berkomunikasi secara dinamis melalui API (GET, POST, PUT, DELETE) dengan integrasi lancar. |
| **2. Fungsionalitas Sistem (Berjalan dengan Baik)** | 25% | Aplikasi belum berjalan penuh; hanya sebagian fitur yang bisa digunakan atau sering error. | Sebagian besar fitur dapat dijalankan dengan baik, meski masih terdapat bug minor. | Semua fitur berfungsi dengan baik, sistem stabil, dan respons cepat tanpa error saat pengujian API. |
| **3. Dokumentasi API (Swagger/Postman)** | 20% | Dokumentasi API belum lengkap, hanya menampilkan sebagian endpoint tanpa deskripsi parameter dan respons. | Dokumentasi API menampilkan sebagian besar endpoint, sudah ada contoh input/output tapi belum konsisten. | Dokumentasi API lengkap dan rapi, mencakup semua endpoint, parameter, contoh request/response, serta mudah dipahami oleh pengguna. |
| **4. Presentasi & Pemahaman Konsep** | 25% | Kurang mampu menjelaskan konsep integrasi API dan Swagger; penyampaian tidak runtut. | Dapat menjelaskan sebagian konsep dan alur kerja API, namun masih kurang mendalam atau ada bagian yang belum dikuasai. | Menjelaskan konsep API, arsitektur layanan, dan Swagger dengan jelas, runtut, serta mampu menjawab pertanyaan dengan baik. |

---

## 14. Konversi Nilai

| Level | Keterangan | Rentang Nilai |
|-------|------------|---------------|
| **Low** | Implementasi dasar, masih banyak kekurangan. | **< 75** |
| **Medium** | Cukup baik, memenuhi sebagian besar kriteria. | **75 – 80** |
| **High** | Lengkap, rapi, dan menunjukkan pemahaman kuat. | **81 – 100** |

---

## 15. Contoh Implementasi Lengkap dengan Flask dan SQLite

### Struktur Proyek Flask Service

```
user-service/
├── app.py                    # Main application file
├── models.py                  # Database models
├── config.py                  # Configuration
├── requirements.txt           # Python dependencies
├── .env                      # Environment variables
├── database.db               # SQLite database file
├── templates/                # HTML templates (jika needed)
└── README.md
```

### config.py

```python
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///database.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PORT = int(os.getenv('PORT', 3001))
    SERVICE_NAME = os.getenv('SERVICE_NAME', 'user-service')
```

### models.py

```python
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    balance = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'balance': self.balance,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<User {self.name}>'

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'credit' or 'debit'
    description = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'amount': self.amount,
            'type': self.type,
            'description': self.description,
            'created_at': self.created_at.isoformat()
        }
```

### app.py

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_restx import Api, Resource, fields
from models import db, User, Transaction
from config import Config
import requests
import os

app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
db.init_app(app)
CORS(app)

# Initialize API documentation
api = Api(app, doc='/api-docs/', version='1.0',
          title='User Service API',
          description='API documentation for User Service')

# Define data models for documentation
user_model = api.model('User', {
    'id': fields.Integer(description='User ID'),
    'name': fields.String(description='User name'),
    'email': fields.String(description='User email'),
    'balance': fields.Float(description='User balance'),
    'created_at': fields.DateTime(description='Creation timestamp')
})

user_input = api.model('UserInput', {
    'name': fields.String(required=True, description='User name'),
    'email': fields.String(required=True, description='User email'),
    'password': fields.String(required=True, description='User password')
})

transaction_model = api.model('Transaction', {
    'id': fields.Integer(description='Transaction ID'),
    'user_id': fields.Integer(description='User ID'),
    'amount': fields.Float(description='Transaction amount'),
    'type': fields.String(description='Transaction type'),
    'description': fields.String(description='Transaction description'),
    'created_at': fields.DateTime(description='Creation timestamp')
})

# Define namespaces
users_ns = api.namespace('users', description='User operations')
transactions_ns = api.namespace('transactions', description='Transaction operations')

@users_ns.route('/')
class UserList(Resource):
    @users_ns.doc('list_users')
    @users_ns.marshal_list_with(user_model)
    def get(self):
        """Get all users"""
        users = User.query.all()
        return [user.to_dict() for user in users]
    
    @users_ns.doc('create_user')
    @users_ns.expect(user_input)
    @users_ns.marshal_with(user_model, code=201)
    def post(self):
        """Create a new user"""
        data = request.get_json()
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return {'error': 'Email already exists'}, 400
        
        # Create new user
        user = User(
            name=data['name'],
            email=data['email'],
            password=data['password']  # In production, hash this password
        )
        
        db.session.add(user)
        db.session.commit()
        
        return user.to_dict(), 201

@users_ns.route('/<int:id>')
@users_ns.response(404, 'User not found')
@users_ns.param('id', 'The user identifier')
class UserResource(Resource):
    @users_ns.doc('get_user')
    @users_ns.marshal_with(user_model)
    def get(self, id):
        """Get user by ID"""
        user = User.query.get(id)
        if not user:
            return {'error': 'User not found'}, 404
        return user.to_dict()
    
    @users_ns.doc('delete_user')
    @users_ns.response(204, 'User deleted')
    def delete(self, id):
        """Delete user by ID"""
        user = User.query.get(id)
        if not user:
            return {'error': 'User not found'}, 404
        
        db.session.delete(user)
        db.session.commit()
        return '', 204

@transactions_ns.route('/')
class TransactionList(Resource):
    @transactions_ns.doc('list_transactions')
    @transactions_ns.marshal_list_with(transaction_model)
    def get(self):
        """Get all transactions"""
        transactions = Transaction.query.all()
        return [transaction.to_dict() for transaction in transactions]
    
    @transactions_ns.doc('create_transaction')
    @transactions_ns.expect(transaction_model)
    @transactions_ns.marshal_with(transaction_model, code=201)
    def post(self):
        """Create a new transaction"""
        data = request.get_json()
        
        # Verify user exists
        user = User.query.get(data['user_id'])
        if not user:
            return {'error': 'User not found'}, 404
        
        # Create transaction
        transaction = Transaction(
            user_id=data['user_id'],
            amount=data['amount'],
            type=data['type'],
            description=data.get('description', '')
        )
        
        # Update user balance
        if data['type'] == 'credit':
            user.balance += data['amount']
        elif data['type'] == 'debit':
            if user.balance < data['amount']:
                return {'error': 'Insufficient balance'}, 400
            user.balance -= data['amount']
        
        db.session.add(transaction)
        db.session.commit()
        
        return transaction.to_dict(), 201

# Internal endpoints for service communication
@app.route('/internal/users/<int:user_id>')
def get_user_internal(user_id):
    """Internal endpoint for other services"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())

@app.route('/internal/users/<int:user_id>/balance', methods=['PUT'])
def update_user_balance(user_id):
    """Internal endpoint to update user balance"""
    data = request.get_json()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    amount = data.get('amount', 0)
    if data.get('type') == 'credit':
        user.balance += amount
    elif data.get('type') == 'debit':
        if user.balance < amount:
            return jsonify({'error': 'Insufficient balance'}), 400
        user.balance -= amount
    
    db.session.commit()
    return jsonify(user.to_dict())

# Health check
@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': '2023-12-01T10:30:00Z',
        'service': os.getenv('SERVICE_NAME', 'user-service'),
        'database': 'connected' if db.engine else 'disconnected'
    })

# Create database tables
@app.before_first_request
def create_tables():
    db.create_all()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    port = Config.PORT
    app.run(host='0.0.0.0', port=port, debug=True)
```

### requirements.txt

```
Flask==2.3.2
Flask-SQLAlchemy==3.0.5
Flask-CORS==4.0.0
Flask-RESTX==1.1.0
python-dotenv==1.0.0
requests==2.31.0
```

### .env

```bash
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///database.db
PORT=3001
SERVICE_NAME=user-service
```

### Cara Menjalankan Service

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
set FLASK_APP=app.py
set FLASK_ENV=development

# Run the application
python app.py
```

---

## 16. Panduan Setup dan Deployment

### Struktur Direktori Proyek

```
project-uts-eai/
├── api-gateway/               # API Gateway
│   ├── src/
│   ├── package.json
│   └── README.md
├── service-1/                 # Service 1 (misal: User Service)
│   ├── src/
│   ├── docs/
│   ├── requirements.txt
│   ├── database.db
│   └── README.md
├── service-2/                 # Service 2 (misal: Payment Service)
│   ├── src/
│   ├── docs/
│   ├── requirements.txt
│   ├── database.db
│   └── README.md
├── service-3/                 # Service 3 (jika jumlah anggota > 2)
│   ├── src/
│   ├── docs/
│   ├── requirements.txt
│   ├── database.db
│   └── README.md
├── service-4/                 # Service 4 (jika jumlah anggota > 3)
│   ├── src/
│   ├── docs/
│   ├── requirements.txt
│   ├── database.db
│   └── README.md
├── frontend/                  # Frontend sederhana
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── README.md
├── docs/                      # Dokumentasi umum
│   ├── api-documentation/
│   └── architecture/
├── scripts/                   # Helper scripts
│   ├── start-all.sh
│   └── stop-all.sh
├── docker-compose.yml         # Docker composition (opsional)
└── README.md                  # Dokumentasi utama proyek
```

### Environment Variables

```bash
# API Gateway
PORT=3000

# Service 1
SERVICE1_PORT=3001
SERVICE1_NAME=user-service

# Service 2
SERVICE2_PORT=3002
SERVICE2_NAME=payment-service

# Service 3 (jika ada)
SERVICE3_PORT=3003
SERVICE3_NAME=patient-service

# Service 4 (jika ada)
SERVICE4_PORT=3004
SERVICE4_NAME=medical-record-service

# Database Options
# Untuk SQLite
DATABASE_URL=sqlite:///database.db

# Untuk MySQL
DATABASE_URL=mysql://username:password@localhost:3306/database_name

# Untuk PostgreSQL
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Untuk MongoDB
DATABASE_URL=mongodb://localhost:27017/database_name
```

### Helper Scripts

#### start-all.bat (Windows)

```batch
@echo off
echo Starting all services...

:: Start API Gateway
cd api-gateway
start cmd /k "npm run dev"
cd ..

:: Start Service 1
cd service-1
start cmd /k "npm run dev"
cd ..

:: Start Service 2
cd service-2
start cmd /k "npm run dev"
cd ..

:: Start Service 3 (jika ada)
if exist "service-3" (
    cd service-3
    start cmd /k "npm run dev"
    cd ..
)

:: Start Service 4 (jika ada)
if exist "service-4" (
    cd service-4
    start cmd /k "npm run dev"
    cd ..
)

echo All services started!
echo API Gateway: http://localhost:3000
echo Service 1: http://localhost:3001
echo Service 2: http://localhost:3002
pause
```

#### start-all.sh (Linux/Mac)

```bash
#!/bin/bash

echo "Starting all services..."

# Start API Gateway
cd api-gateway
npm run dev &
GATEWAY_PID=$!
cd ..

# Start Service 1
cd service-1
npm run dev &
SERVICE1_PID=$!
cd ..

# Start Service 2
cd service-2
npm run dev &
SERVICE2_PID=$!
cd ..

# Start Service 3 (jika ada)
if [ -d "service-3" ]; then
    cd service-3
    npm run dev &
    SERVICE3_PID=$!
    cd ..
fi

# Start Service 4 (jika ada)
if [ -d "service-4" ]; then
    cd service-4
    npm run dev &
    SERVICE4_PID=$!
    cd ..
fi

echo "All services started!"
echo "API Gateway: http://localhost:3000"
echo "Service 1: http://localhost:3001"
echo "Service 2: http://localhost:3002"

# Wait for user input to stop
read -p "Press Enter to stop all services..."

# Kill all processes
kill $GATEWAY_PID $SERVICE1_PID $SERVICE2_PID
if [ ! -z "$SERVICE3_PID" ]; then
    kill $SERVICE3_PID
fi
if [ ! -z "$SERVICE4_PID" ]; then
    kill $SERVICE4_PID
fi

echo "All services stopped."
```

---

## 17. Best Practices

### API Design

- Gunakan HTTP methods yang sesuai (GET, POST, PUT, DELETE)
- Implementasikan status code HTTP yang tepat
- Gunakan naming convention yang konsisten
- Implementasikan pagination untuk data yang besar

### Error Handling

- Gunakan format error response yang konsisten
- Implementasikan logging untuk debugging
- Berikan pesan error yang informatif

### Security

- Validasi input data
- Implementasikan rate limiting
- Gunakan HTTPS untuk production
- Jangan expose sensitive information

### Documentation

- Dokumentasikan semua endpoint
- Berikan contoh request dan response
- Jelaskan parameter yang diperlukan
- Update dokumentasi secara berkala

---

## 18. Resources Tambahan

### API Documentation Tools

- [Swagger/OpenAPI](https://swagger.io/) - Documentation framework
- [Postman](https://www.postman.com/) - API testing and documentation
- [Insomnia](https://insomnia.rest/) - REST client

### Development Tools

- [Git](https://git-scm.com/) - Version control
- [Docker](https://www.docker.com/) - Containerization (opsional)
- [VS Code](https://code.visualstudio.com/) - Code editor

### Learning Resources

- [REST API Design Best Practices](https://restfulapi.net/)
- [Microservices Patterns](https://microservices.io/patterns/)
- [OpenAPI Specification](https://swagger.io/specification/)

---

## 19. FAQ

**Q: Apakah kita harus menggunakan database?**

A: Ya, salah satu database (MySQL/MongoDB/PostgreSQL) harus digunakan sesuai spesifikasi teknis.

**Q: Apakah API Gateway wajib digunakan?**

A: Ya, API Gateway wajib digunakan sebagai pintu masuk komunikasi antar layanan.

**Q: Berapa jumlah minimal layanan yang harus dibuat?**

A: Jumlah layanan minimal harus sama dengan jumlah anggota kelompok, dengan minimal 2 layanan.

**Q: Apakah frontend harus kompleks?**

A: Tidak, frontend yang sederhana (HTML + JS biasa atau React/Vue sederhana) sudah cukup.

**Q: Bagaimana cara mengakses dokumentasi Swagger?**

A: Dokumentasi Swagger harus dapat diakses melalui endpoint /api-docs pada setiap service.

---

## 20. Kontak dan Support

Jika Anda memiliki pertanyaan atau mengalami masalah selama pengerjaan proyek:

1. Periksa dokumentasi yang tersedia
2. Konsultasi dengan dosen pengampu

---

**Catatan:** Deadline Sebelum perkuliahan pekan 9.
