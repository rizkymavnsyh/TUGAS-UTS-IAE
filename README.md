# Food Delivery Microservices System

Sistem food delivery berbasis microservices architecture dengan JWT authentication, mendemonstrasikan inter-service communication dan API Gateway pattern untuk aplikasi e-commerce makanan.

**📚 Mata Kuliah:** Integrasi Aplikasi Enterprise 
**🎓 Institusi:** Telkom University
**📅 Semester:** 5


---

## 📋 Deskripsi Proyek

### Topik
**Food Delivery Platform dengan Microservices Architecture**

### Overview
Proyek ini mengimplementasikan sistem pemesanan makanan online yang terdiri dari **4 microservices independen** (User, Restaurant, Order, Payment) yang berkomunikasi melalui **API Gateway tunggal**. Sistem ini mendemonstrasikan:

✅ **JWT-based authentication** & role-based authorization (admin/user)  
✅ **Service-to-service communication** via HTTP/REST  
✅ **Orchestrated transactions** (Order Service sebagai orchestrator)  
✅ **Centralized API routing** & security via API Gateway  
✅ **4 isolated databases** (satu per service)  
✅ **Full CRUD operations** dengan Swagger UI documentation  

### Tech Stack

**Backend:**
- **API Gateway**: Node.js + Express.js + JWT + http-proxy-middleware
- **Microservices**: Python Flask + Flask-RESTX + SQLAlchemy
- **Database**: MySQL 8.0 (4 databases terpisah)

**Frontend:**
- HTML5, CSS3 (Bootstrap 5)
- Vanilla JavaScript (Fetch API)

**DevOps:**
- Docker & Docker Compose
- Gunicorn (Python WSGI server)
- Health check monitoring

**Testing:**
- Postman Collection (29 endpoints)
- Swagger UI (setiap service)

---

## 🏗️ Arsitektur Sistem

### Diagram Arsitektur

```
┌──────────────┐
│    Client    │ (Browser - login.html / dashboard.html)
│ (Port: File) │
└──────┬───────┘
       │ HTTP/JSON + JWT Bearer Token
       ▼
┌─────────────────────┐
│   API Gateway       │ ← Single Entry Point (Port 3000)
│   (Node.js + JWT)   │   • Authentication (login/refresh)
│   Port: 3000        │   • Route forwarding & proxy
└──────┬──────────────┘   • Role-based access control (admin/user)
       │                   • CORS handling
       │
       │ Forward requests with X-User-Id headers
       │
   ┌───┴────┬────────────┬───────────┐
   │        │            │           │
   ▼        ▼            ▼           ▼
┌────────┐ ┌──────────┐ ┌────────┐ ┌─────────┐
│  User  │ │Restaurant│ │ Order  │ │ Payment │
│Service │ │ Service  │ │Service │ │ Service │
│ :3001  │ │  :3002   │ │ :3003  │ │  :3004  │
│Provider│ │ Provider │ │Consumer│ │ Provider│
└───┬────┘ └─────┬────┘ └───┬────┘ └────┬────┘
    │            │           │           │
    │            │   Inter-service HTTP  │
    │            │   Communication       │
    │            │   (Internal endpoints)│
    │            │           │           │
    └────────────┴───────────┴───────────┘
                     │
          ┌──────────┴──────────┐
          ▼          ▼          ▼         ▼
      ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐
      │users│   │resto│   │order│   │pay  │
      │_db  │   │_db  │   │_db  │   │_db  │
      └─────┘   └─────┘   └─────┘   └─────┘
         MySQL 8.0 (Port 3309 → 3306)
```

### Communication Flow

**1. Client → API Gateway**: Login & mendapat JWT token  
**2. Client → API Gateway → Services**: Semua request melalui gateway dengan validasi token  
**3. Order Service → Restaurant Service**: Ambil harga menu item  
**4. Order Service → User Service**: Validasi user existence  
**5. Order Service → Payment Service**: Proses pembayaran otomatis  

### Service Roles

| Service | Role | Port | Database | Deskripsi |
|---------|------|------|----------|-----------|
| **API Gateway** | Router | 3000 | - | Entry point, JWT auth, proxy |
| **User Service** | Provider | 3001 | users_db | User CRUD, password hashing |
| **Restaurant Service** | Provider | 3002 | restaurants_db | Restaurant & menu CRUD |
| **Order Service** | **Consumer** | 3003 | orders_db | Orchestrates order flow, calls other services |
| **Payment Service** | Provider | 3004 | payments_db | Payment processing |

---

## 🚀 Cara Menjalankan

### Prerequisites
- Docker Desktop (v20.10+) - **REQUIRED**
- Docker Compose (v2.0+) - **REQUIRED**
- Port tersedia: 3000, 3001-3004, 3309
- Browser modern (Chrome, Firefox, Edge)

### 1️⃣ Clone Repository

```bash
git clone <repository-url>
cd food-delivery-microservices
```

### 2️⃣ Start All Services (Docker Compose)

```bash
# Build & start semua services sekaligus
docker-compose up -d --build

# Verifikasi semua services running
docker-compose ps

# Expected output:
# NAME                STATUS              PORTS
# mysql-db           running (healthy)   0.0.0.0:3309->3306/tcp
# api-gateway        running             0.0.0.0:3000->3000/tcp
# user-service       running             0.0.0.0:3001->3001/tcp
# restaurant-service running             0.0.0.0:3002->3002/tcp
# order-service      running             0.0.0.0:3003->3003/tcp
# payment-service    running             0.0.0.0:3004->3004/tcp
```

### ⏱️ Startup Order (Otomatis via `depends_on`)

Docker Compose mengatur startup order secara otomatis:

1. **MySQL** (10-30 detik) → Tunggu health check passed
2. **User, Restaurant, Payment Services** → Start setelah MySQL ready
3. **Order Service** → Start setelah User, Restaurant, Payment ready
4. **API Gateway** → Start terakhir setelah semua services ready

**💡 Tips:** Tunggu ~1-2 menit pertama kali untuk MySQL initialization.

### 3️⃣ Verify Services Running

```bash
# Cek logs semua services
docker-compose logs -f

# Cek logs service tertentu
docker-compose logs -f order-service

# Test health check
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
```

### 4️⃣ Akses Aplikasi

**API Gateway:**
- Base URL: http://localhost:3000
- Health Check: http://localhost:3000/health

**Swagger UI Documentation:**
- User Service: http://localhost:3001/api-docs/
- Restaurant Service: http://localhost:3002/api-docs/
- Order Service: http://localhost:3003/api-docs/
- Payment Service: http://localhost:3004/api-docs/

**Dashboard UI:**
- Login Page: `dashboard/login.html` (buka di browser)
- Dashboard: `dashboard/dashboard.html` (setelah login)

### 5️⃣ Login & Testing

**Default Credentials:**
- **Admin**: `admin` / `admin123` (full CRUD access)
- **User**: `rizky` / `user123` (read-only access)

**Quick Test via Postman:**
1. Import `uts-iae-collection-full-crud.json`
2. Import `uts-iae-environment.json`
3. Run request: **POST Login (Get JWT Token)**
4. Token otomatis tersimpan di Collection Variable
5. Test endpoint lainnya

### 6️⃣ Stop Services

```bash
# Stop semua services (data tetap tersimpan)
docker-compose down

# Stop dan hapus semua data (HATI-HATI!)
docker-compose down -v

# Restart service tertentu
docker-compose restart order-service
```

---

## 🔧 Environment Variables

File `.env` sudah disediakan di setiap folder service. **Tidak perlu setup manual** kecuali ingin customize.

### API Gateway (`api-gateway/.env`)
```env
PORT=3000
JWT_SECRET=your-very-secret-jwt-key-change-in-production
JWT_EXPIRATION=24h
NODE_ENV=development
```

### Order Service (`order-service/.env`)
```env
SECRET_KEY=order-secret-key
DATABASE_URL=mysql+pymysql://root:@mysql-db:3306/orders_db
PORT=3003
SERVICE_NAME=order-service

# Service URLs untuk inter-service communication
USER_SERVICE_URL=http://user-service:3001
RESTAURANT_SERVICE_URL=http://restaurant-service:3002
PAYMENT_SERVICE_URL=http://payment-service:3004
```

### User, Restaurant, Payment Services
Sama seperti Order Service, sesuaikan:
- `DATABASE_URL` → database name per service
- `PORT` → port number unik
- `SERVICE_NAME` → nama service

---

## 👥 Tim & Pembagian Tugas

| Nama | NIM | Peran Utama | Kontribusi Detail |
|------|-----|-------------|-------------------|
| **Alvina Sulistina** | 102022300102 | **Technical Writer** | • Dokumentasi lengkap (README.md, API documentation)<br>• User manual & troubleshooting guide<br>• Screenshot dokumentasi (Swagger, Postman, Health Check)<br>• Quality assurance dokumentasi |
| **Mochamad Rizky Maulana Aviansyah** | 102022300021 | **Full Stack Developer** | • **API Gateway** (Node.js + Express):<br>&nbsp;&nbsp;◦ JWT authentication & token management<br>&nbsp;&nbsp;◦ Request routing & proxy middleware<br>&nbsp;&nbsp;◦ CORS & error handling<br>• **Frontend Dashboard**:<br>&nbsp;&nbsp;◦ Login/dashboard UI dengan Bootstrap<br>&nbsp;&nbsp;◦ Real-time data fetching via fetch() API<br>&nbsp;&nbsp;◦ Metrics cards & activity timeline<br>&nbsp;&nbsp;◦ **Service orchestration**: calls User, Restaurant, Payment<br>&nbsp;&nbsp;◦ Transaction flow coordination|
| **Bimo Alfarizy Lukman** | 102022330069 | **Documentation & QA Engineer** | • Postman collection lengkap (29 endpoints)<br>• Testing manual & automated (test scripts)<br>• Screenshot dokumentasi:<br>&nbsp;&nbsp;◦ Swagger UI (4 services)<br>&nbsp;&nbsp;◦ Postman requests & responses<br>&nbsp;&nbsp;◦ Health check endpoints<br>• Bug reporting & regression testing<br>• **Payment Service** (Flask):<br>&nbsp;&nbsp;◦ Payment transaction processing<br>&nbsp;&nbsp;◦ Balance validation & ledger<br>• Database schema design (MySQL)<br>• Inter-service communication architecture|
| **Revaldo A. Nainggolan** | 102022330325 | **Backend Architect** |• Docker containerization setup<br>• Docker Compose orchestration<br>• MySQL database initialization (init-db.sql)<br>• Health check endpoints<br>• Service monitoring & logging<br>• **Order Service** (Flask):<br>&nbsp;&nbsp;◦ Order creation & status management |
| **[Tim Bersama]** | - | **DevOps & Infrastructure** | • Docker containerization setup<br>• Docker Compose orchestration<br>• MySQL database initialization (init-db.sql)<br>• Health check endpoints<br>• Service monitoring & logging<br>• Integration testing & deployment |

---

## 📡 Ringkasan Endpoint API

### 🔓 Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login & get JWT token (expires 24h) |
| POST | `/auth/refresh` | Refresh access token using refresh token |

### 🔒 Protected Endpoints (Auth Required)

Semua endpoint di bawah memerlukan header:
```
Authorization: Bearer {token}
```

#### **User Service** (`/api/user/`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/users/` | admin, user | List all users |
| GET | `/users/:id` | admin, user | Get user by ID |
| POST | `/users/` | **admin** 🔒 | Create new user |
| PUT | `/users/:id` | **admin** 🔒 | Update user |
| DELETE | `/users/:id` | **admin** 🔒 | Delete user |

#### **Restaurant Service** (`/api/restaurant/`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/restaurants/` | admin, user | List all restaurants |
| GET | `/restaurants/:id` | admin, user | Get restaurant by ID |
| GET | `/restaurants/:id/menu` | admin, user | Get menu by restaurant |
| POST | `/restaurants/` | **admin** 🔒 | Create restaurant |
| POST | `/restaurants/:id/menu` | **admin** 🔒 | Add menu item |
| PUT | `/restaurants/:id` | **admin** 🔒 | Update restaurant |
| DELETE | `/restaurants/:id` | **admin** 🔒 | Delete restaurant |

#### **Order Service** (`/api/order/`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/orders/` | admin, user | List all orders |
| GET | `/orders/:id` | admin, user | Get order details |
| POST | `/orders/` | **admin** 🔒 | **Create order (triggers payment)** |
| PUT | `/orders/:id` | **admin** 🔒 | Update order status |
| DELETE | `/orders/:id` | **admin** 🔒 | Delete order |

**⚠️ POST /orders/ Flow:**
1. Validasi `user_id` → call User Service
2. Fetch harga menu → call Restaurant Service  
3. Calculate `total_price`
4. Proses payment → call Payment Service
5. Return order dengan status `PAID` jika payment berhasil

#### **Payment Service** (`/api/payment/`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/payments/` | admin, user | List all transactions |
| GET | `/payments/:id` | admin, user | Get transaction details |
| PUT | `/payments/:id` | **admin** 🔒 | Update payment status (DEMO) |
| DELETE | `/payments/:id` | **admin** 🔒 | Delete payment (DEMO) |

**📝 Note:** PUT dan DELETE untuk **DEMO purposes only**. Dalam production, transaction records harus immutable.

---
## 🚦 Testing Workflow
### 🧪 Testing dengan Postman

#### Import Collection

**Files:**
- `uts-iae-collection-full-crud.json` - Collection lengkap (29 endpoints)
- `uts-iae-environment.json` - Environment variables

**Steps:**
1. Buka Postman Desktop/Web
2. Click **Import** → pilih kedua file
3. Collection muncul di sidebar kiri
4. Select environment "UTS IAE Environment"

### 📂 Struktur Collection

Collection terdiri dari **6 kategori** dengan **29 endpoints**:

#### **1. AUTHENTICATION** (4 requests)
- POST Login (Get JWT Token) - Admin login
- POST Seed Read-Only User - Create user 'rizky'
- POST Login as User (Read-Only Access) - User login
- POST Refresh Token - Get new access token

#### **2. USER SERVICE - FULL CRUD** (5 requests)
- GET All Users
- GET User by ID
- POST Create User (admin only)
- PUT Update User (admin only)
- DELETE User (admin only)

#### **3. RESTAURANT SERVICE - FULL CRUD** (5 requests)
- GET All Restaurants
- GET Restaurant by ID
- POST Create Restaurant (admin only)
- PUT Update Restaurant (admin only)
- DELETE Restaurant (admin only)

#### **4. MENU ITEMS - FULL CRUD** (5 requests)
- GET All Menu Items by Restaurant
- GET Menu Item by ID
- POST Create Menu Item (admin only)
- PUT Update Menu Item (admin only)
- DELETE Menu Item (admin only)

#### **5. ORDER SERVICE** (5 requests)
- GET All Orders
- POST Create Order (Full Flow) - **Trigger payment otomatis**
- GET Order by ID
- PUT Update Order Status (Demo)
- DELETE Order (Demo)

#### **6. PAYMENT SERVICE - FULL CRUD** (5 requests)
- GET All Transactions
- GET Transaction by ID
- POST Process Payment (Create Transaction)
- PUT Update Transaction Status (DEMO ONLY)
- DELETE Transaction (DEMO ONLY)

### 🔄 Testing Flow (Recommended Order)

**Step 1: Authentication**
```bash
1. POST Login (Get JWT Token)
   → Credential: admin / admin123
   → Token otomatis tersimpan di {{token}}
   → User ID tersimpan di {{user_id}}
```

**Step 2: Seed Data (Optional)**
```bash
2. POST Seed Read-Only User
   → Membuat user 'rizky' untuk testing RBAC
```

**Step 3: Test CRUD User Service**
```bash
3. GET All Users → Verify user admin & rizky ada
4. POST Create User → Buat user baru
5. GET User by ID → Verify user created
6. PUT Update User → Update user data
7. DELETE User → Hapus user (jika perlu)
```

**Step 4: Test CRUD Restaurant Service**
```bash
8. POST Create Restaurant → Buat restaurant (Pizza Hut)
9. GET All Restaurants → Verify created
10. POST Create Menu Item → Tambah menu (Pepperoni Pizza, Rp 85.000)
11. GET All Menu Items by Restaurant → Verify menu
```

**Step 5: Test Order Flow (Inter-Service)**
```bash
12. POST Create Order (Full Flow)
    Body: {
      "user_id": 1,
      "restaurant_id": 1,
      "items": [{"menu_item_id": 1, "quantity": 2}]
    }
    → Response: status "PAID" (payment otomatis berhasil)
    → Order ID otomatis tersimpan di {{order_id}}

13. GET All Orders → Verify order dengan items & total_price
14. GET Order by ID → Detail order
```

**Step 6: Test Payment Service**
```bash
15. GET All Transactions → Verify payment transaction created
16. GET Transaction by ID → Detail transaction
```

**Step 7: Test RBAC (Role-Based Access)**
```bash
17. POST Login as User (Read-Only)
    → Credential: rizky / user123
18. Try GET requests → Should succeed ✅
19. Try POST/PUT/DELETE → Should fail with 403 Forbidden ❌
```
### 🧪 Testing dengan Dashboard
```bash
# Start dashboard
cd dashboard
python -m http.server 8080

# Test flow
1. Login sebagai admin
2. Click "Fetch All Users"
3. Click "Create New Restaurant"
4. Click "Create New Order" → otomatis trigger payment
5. Lihat metrics update real-time
```

### 🧪 Testing dengan cURL
```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Save token dari response, lalu:
TOKEN="your-jwt-token-here"

# Get users
curl http://localhost:3000/api/user/users/ \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Database Schema

### users_db
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### restaurants_db
```sql
CREATE TABLE restaurants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menu_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);
```

### orders_db
```sql
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL,
    price_at_time DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
```

### payments_db
```sql
CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_id INT NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🔐 Security Features

1. **JWT Authentication**: Token-based auth dengan expiry (24h access, 7d refresh)
2. **Role-Based Access Control (RBAC)**: Admin vs User permissions
3. **Password Hashing**: Bcrypt untuk semua password (cost factor 10)
4. **CORS Protection**: Configured di API Gateway untuk semua origins
5. **Input Validation**: Request validation di setiap service endpoint
6. **SQL Injection Prevention**: SQLAlchemy ORM dengan parameterized queries
7. **Error Handling**: Consistent error response format dengan status codes
8. **Service Isolation**: Setiap service punya database sendiri (database per service pattern)

---

## 🐛 Troubleshooting

### Services Tidak Start?

**Masalah:** Container exit atau restart terus-menerus

```bash
# Cek logs error
docker-compose logs -f [service-name]

# Contoh: cek order-service
docker-compose logs -f order-service

# Cari error seperti:
# - "Database connection error"
# - "Port already in use"
# - "Module not found"
```

**Solusi:**
```bash
# Restart service tertentu
docker-compose restart order-service

# Full reset (HATI-HATI: hapus semua data!)
docker-compose down -v
docker-compose up -d --build
```

---

### JWT Token Expired?

**Masalah:** Error 403 "Invalid or expired token"

**Solusi:**
```bash
# Access token expire 24 jam
# Re-login untuk token baru
POST /auth/login

# Atau gunakan refresh token
POST /auth/refresh
Header: Authorization: Bearer {refresh_token}
```

---

### Port Conflict?

**Masalah:** Error "Port already in use"

**Solusi:**
```bash
# Ganti port di docker-compose.yml
ports:
  - "3010:3000"  # Ganti 3010 dengan port lain yang tersedia
  
# Atau hentikan aplikasi yang pakai port tersebut
# Windows:
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F

# Linux/Mac:
lsof -i :3000
kill -9 [PID]
```

---

### MySQL Connection Refused?

**Masalah:** Service tidak bisa connect ke database

**Solusi:**
```bash
# Tunggu MySQL health check selesai (30-60 detik pertama kali)
docker-compose logs mysql-db | grep "ready for connections"

# Jika masih gagal, restart services
docker-compose restart user-service restaurant-service order-service payment-service

# Cek MySQL container
docker-compose exec mysql-db mysql -u root -e "SHOW DATABASES;"
```

---

### Error 404 Not Found?

**Masalah:** POST Create Order gagal dengan "User not found" atau "Transaction not found"

**Root Cause:** ID yang digunakan tidak ada di database

**Solusi:**
```bash
# SELALU cek data yang ada dulu sebelum POST

# 1. Cek user ID yang ada
GET /api/user/users/

# 2. Cek restaurant ID yang ada
GET /api/restaurant/restaurants/

# 3. Cek menu item ID yang ada
GET /api/restaurant/restaurants/1/menu

# 4. Pakai ID yang BENAR ada di response GET
POST /api/order/orders/
{
    "user_id": 1,          ← ID yang BENAR ada
    "restaurant_id": 1,
    "items": [{"menu_item_id": 1, "quantity": 2}]
}
```

---

### Error 500 Internal Server Error?

**Masalah:** Backend service crash atau error

**Solusi:**
```bash
# Lihat logs untuk detail error
docker-compose logs -f order-service

# Cari error seperti:
# - KeyError: 'user_id'
# - Database connection error
# - Service communication failed

# Restart service
docker-compose restart order-service
```

---

### Error 504 Gateway Timeout?

**Masalah:** API Gateway tidak bisa connect ke backend service

**Solusi:**
```bash
# Cek service running
docker-compose ps

# Pastikan service target UP
# Jika Exit atau Restarting → ada masalah

# Cek logs service yang error
docker-compose logs restaurant-service

# Restart service
docker-compose restart restaurant-service
```

---

### Cannot Delete Paid Order/Payment?

**Masalah:** Error "Cannot delete a paid order"

**Root Cause:** By design untuk data integrity

**Solusi:**
```bash
# Jangan DELETE order/payment yang sudah PAID
# Gunakan PUT untuk update status

PUT /api/order/orders/{id}
{
    "status": "CANCELLED"
}

# Atau
{
    "status": "REFUNDED"
}
```

## 📸 Bukti Pengujian

Dokumentasi visual untuk membuktikan semua fitur berjalan dengan baik. Simpan screenshot di folder `docs/screenshots/`.
### 1️⃣ Swagger UI 
#### UI
![Login Success](<docs/screenshots/swagger/Login Success.jpeg>)
![Login Failed](<docs/screenshots/swagger/Login Failed.jpeg>)
![Api Actions](<docs/screenshots/swagger/Api Actions.jpeg>)
![User Profile.jpeg](<docs/screenshots/swagger/User Profile.jpeg>)

---

## 📦 Struktur Project

```
food-delivery-microservices/
├── api-gateway/
│   ├── Dockerfile
│   ├── package.json
│   ├── .env
│   └── index.js
├── user-service/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env
│   ├── app.py
│   ├── models.py
│   ├── config.py
│   └── gunicorn.conf.py
├── restaurant-service/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env
│   ├── app.py
│   ├── models.py
│   └── config.py
├── order-service/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env
│   ├── app.py
│   ├── models.py
│   ├── config.py
│   └── gunicorn.conf.py
├── payment-service/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env
│   ├── app.py
│   ├── models.py
│   └── config.py
├── dashboard/
│   ├── login.html
│   ├── dashboard.html
│   └── js/
│       ├── auth.js
│       └── app.js
├── docs/
│   └── screenshots/
│       ├── swagger/
│       ├── postman/
│       └── health-check/
├── docker-compose.yml
├── init-db.sql
├── uts-iae-collection-full-crud.json
├── uts-iae-environment.json
└── README.md
```

---

## 🔗 Quick Links

### API Documentation
- **User Service Swagger**: http://localhost:3001/api-docs/
- **Restaurant Service Swagger**: http://localhost:3002/api-docs/
- **Order Service Swagger**: http://localhost:3003/api-docs/
- **Payment Service Swagger**: http://localhost:3004/api-docs/

### Health Check
- **API Gateway**: http://localhost:3000/health
- **User Service**: http://localhost:3001/health
- **Restaurant Service**: http://localhost:3002/health
- **Order Service**: http://localhost:3003/health
- **Payment Service**: http://localhost:3004/health

### Postman Collection
- Import file: `uts-iae-collection-full-crud.json`
- Import environment: `uts-iae-environment.json`

---


## 📞 Support & Contact

### Jika Mengalami Kendala:

1. ✅ Cek section **Troubleshooting** di atas
2. 📋 Lihat logs: `docker-compose logs -f [service-name]`
3. 🔍 Pastikan environment variables sudah benar
4. 🆘 Konsultasi dengan dosen pengampu

---

## 📄 License & Credits
**Tim Pengembang:**
- Alvina Sulistina (102022300102) - Technical Writer
- Mochamad Rizky Maulana Aviansyah (102022300021) - Full Stack Developer
- Bimo Alfarizy Lukman (102022330069) - QA Engineer
- Revaldo A. Nainggolan (102022330325) - Backend Architect

---

**🚀 Happy Coding & Good Luck with UTS!**

Made with ❤️ by Kelompok 6

---

## Appendix: Command Reference

### Docker Commands
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart [service-name]

# Rebuild and restart
docker-compose up -d --build

# Remove all data (CAUTION!)
docker-compose down -v
```

### Testing Commands
```bash
# Test health check
curl http://localhost:3000/health

# Test login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test with authentication
curl http://localhost:3000/api/user/users/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Database Commands
```bash
# Access MySQL container
docker-compose exec mysql-db mysql -u root

# Show databases
SHOW DATABASES;

# Use specific database
USE users_db;

# Show tables
SHOW TABLES;

# Query users
SELECT * FROM users;
```

---

**End of README.md**
