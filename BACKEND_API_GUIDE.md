# Backend API Implementation Guide

This guide outlines the exact API endpoints and response formats needed to integrate with the Dairy-Logix frontend.

---

## 🔧 Base Configuration

### API Base URL
```
http://localhost:3001/api
```

### Required Headers
```
Content-Type: application/json
Authorization: Bearer <access_token>
X-Tenant-ID: <tenant_id>
X-Tenant-Slug: <tenant_slug>
```

---

## 📝 Standard Response Format

All API responses should follow this format:

### Success Response
```typescript
{
  "success": true,
  "data": <response_data>,
  "message": "Operation successful" // optional
}
```

### Error Response
```typescript
{
  "success": false,
  "error": "Error description",
  "message": "User-friendly error message"
}
```

### Paginated Response
```typescript
{
  "success": true,
  "data": {
    "data": [...], // array of items
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

---

## 🔐 Authentication Endpoints

### POST /api/auth/login
**Purpose**: Authenticate user and issue tokens

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "tenantSlug": "acme-dairy" // optional, only for tenant users
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "tenant_admin", // super_admin | tenant_admin | employee | shopkeeper
      "status": "active",
      "tenantId": "tenant-123", // null for super_admin
      "agencyIds": ["agency-1"], // array or null
      "language": "en",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error** (401 Unauthorized):
```json
{
  "success": false,
  "error": "Invalid credentials",
  "message": "Email or password is incorrect"
}
```

---

### POST /api/auth/register
**Purpose**: Register new user account

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567890",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": { /* same as login response */ },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

### POST /api/auth/refresh
**Purpose**: Refresh expired access token

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
}
```

---

### POST /api/auth/logout
**Purpose**: Invalidate refresh token

**Request**: No body needed, just Authorization header

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET /api/auth/me
**Purpose**: Get current authenticated user

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "tenant_admin",
    "status": "active",
    "tenantId": "tenant-123",
    "agencyIds": ["agency-1"],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## 📦 Product Endpoints

### GET /api/products
**Purpose**: Get paginated list of products

**Query Parameters**:
```
?page=1
&pageSize=10
&sortBy=name
&sortOrder=asc
&search=milk
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "prod-123",
        "productCode": "MILK-500",
        "name": "Full Cream Milk 500ml",
        "shortName": "FCM 500",
        "category": "Crate", // or "Box"
        "quantityPerUnit": 20,
        "purchasePricePerUnit": 25.00,
        "sellingPricePerUnit": 30.00,
        "isActive": true,
        "tenantId": "tenant-123",
        "description": "Fresh full cream milk",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 10,
    "totalPages": 5
  }
}
```

---

### GET /api/products/:id
**Purpose**: Get single product by ID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "prod-123",
    "productCode": "MILK-500",
    "name": "Full Cream Milk 500ml",
    // ... rest of product fields
  }
}
```

---

### POST /api/products
**Purpose**: Create new product

**Request Body**:
```json
{
  "productCode": "MILK-1L",
  "name": "Full Cream Milk 1 Liter",
  "shortName": "FCM 1L",
  "category": "Crate",
  "quantityPerUnit": 12,
  "purchasePricePerUnit": 48.00,
  "sellingPricePerUnit": 55.00,
  "description": "Fresh full cream milk - 1 liter pack"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "prod-456",
    "productCode": "MILK-1L",
    "name": "Full Cream Milk 1 Liter",
    // ... all product fields
  }
}
```

---

### PUT /api/products/:id
**Purpose**: Update existing product

**Request Body**: Same as POST, but all fields optional
```json
{
  "sellingPricePerUnit": 60.00,
  "isActive": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "prod-456",
    // ... updated product
  }
}
```

---

### DELETE /api/products/:id
**Purpose**: Delete product

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## 🏢 Tenant Endpoints (Super Admin Only)

### GET /api/tenants
**Purpose**: Get all tenants (paginated)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "tenant-123",
        "name": "Acme Dairy Ltd",
        "slug": "acme-dairy",
        "contactPerson": "John Manager",
        "email": "contact@acmedairy.com",
        "phone": "+1234567890",
        "status": "active", // active | inactive | suspended
        "plan": "premium", // basic | standard | premium | enterprise
        "agencyCount": 5,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 20,
    "page": 1,
    "pageSize": 10,
    "totalPages": 2
  }
}
```

---

## 📊 Dashboard Endpoints

### GET /api/dashboard/super-admin
**Purpose**: Get super admin dashboard statistics

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalTenants": 45,
    "activeTenants": 38,
    "totalShopkeepers": 1250,
    "totalRevenue": 5450000,
    "tenantGrowth": {
      "labels": ["Jan", "Feb", "Mar", "Apr", "May"],
      "datasets": [{
        "label": "Tenants",
        "data": [30, 35, 38, 42, 45]
      }]
    },
    "recentActivity": [
      {
        "id": "activity-1",
        "type": "tenant_signup",
        "tenantName": "New Dairy Co",
        "message": "New tenant registered",
        "timestamp": "2024-01-01T12:00:00Z"
      }
    ]
  }
}
```

---

### GET /api/dashboard/tenant
**Purpose**: Get tenant dashboard statistics

**Headers**: Must include `X-Tenant-ID` or derive from JWT

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "ordersToday": 45,
    "pendingDeliveries": 12,
    "pendingCollections": 8,
    "totalShopkeepers": 150,
    "activeEmployees": 25,
    "revenueThisMonth": 450000,
    "outstandingPayments": 85000,
    "dailyOrderTrend": {
      "labels": ["Day 1", "Day 2", ...],
      "datasets": [...]
    }
  }
}
```

---

## 🚚 Order Endpoints

### GET /api/orders
**Purpose**: Get orders with filters

**Query Parameters**:
```
?page=1
&pageSize=10
&agencyId=agency-123
&status=pending
&dateFrom=2024-01-01
&dateTo=2024-01-31
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "order-123",
        "orderNumber": "ORD-2024-0001",
        "tenantId": "tenant-123",
        "agencyId": "agency-123",
        "shopId": "shop-456",
        "status": "placed", // placed | confirmed | dispatched | delivered | completed | cancelled
        "items": [
          {
            "id": "item-1",
            "productId": "prod-123",
            "quantity": 100,
            "unitPrice": 30.00,
            "totalPrice": 3000.00
          }
        ],
        "subtotal": 3000.00,
        "tax": 540.00,
        "total": 3540.00,
        "notes": "Urgent delivery",
        "placedAt": "2024-01-01T10:00:00Z",
        "createdAt": "2024-01-01T10:00:00Z",
        "updatedAt": "2024-01-01T10:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

---

## 🔐 Authentication & Authorization

### JWT Token Payload
```json
{
  "userId": "user-123",
  "role": "tenant_admin",
  "tenantId": "tenant-123",
  "agencyIds": ["agency-1"],
  "exp": 1234567890,
  "iat": 1234567890
}
```

### Role-Based Access Control

| Role | Access |
|------|--------|
| `super_admin` | All tenants, all features, admin panel |
| `tenant_admin` | Own tenant data, all features |
| `employee` | Assigned shops, deliveries, collections |
| `shopkeeper` | Own shop data, orders, invoices |

---

## 🔄 Multi-Tenancy Implementation

### Approach 1: Single Database with Tenant ID
- Add `tenantId` column to all tables
- Filter all queries by tenantId
- Extract tenantId from JWT or X-Tenant-ID header

### Approach 2: Separate Database per Tenant
- Use tenant slug to determine database connection
- More isolation, better for large tenants
- More complex management

**Recommended**: Start with Approach 1

---

## 🧪 Testing Endpoints

### Sample cURL Commands

**Login**:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

**Get Products**:
```bash
curl -X GET http://localhost:3001/api/products?page=1&pageSize=10 \
  -H "Authorization: Bearer <access_token>" \
  -H "X-Tenant-ID: tenant-123"
```

**Create Product**:
```bash
curl -X POST http://localhost:3001/api/products \
  -H "Authorization: Bearer <access_token>" \
  -H "X-Tenant-ID: tenant-123" \
  -H "Content-Type: application/json" \
  -d '{
    "productCode": "TEST-001",
    "name": "Test Product",
    "shortName": "Test",
    "category": "Crate",
    "quantityPerUnit": 10,
    "purchasePricePerUnit": 20,
    "sellingPricePerUnit": 25
  }'
```

---

## 🗄️ Database Schema Essentials

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Products Table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  product_code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(100),
  category VARCHAR(50) NOT NULL,
  quantity_per_unit INTEGER NOT NULL,
  purchase_price_per_unit DECIMAL(10, 2) NOT NULL,
  selling_price_per_unit DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, product_code)
);
```

---

## 🚀 Quick Start Backend Setup

### Option 1: Node.js + Express + PostgreSQL

1. **Install Dependencies**:
```bash
npm install express pg bcrypt jsonwebtoken cors dotenv
npm install -D nodemon typescript @types/node @types/express
```

2. **Basic Server Structure**:
```
backend/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── products.routes.ts
│   │   └── ...
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── tenant.middleware.ts
│   ├── models/
│   └── utils/
├── package.json
└── .env
```

### Option 2: NestJS + TypeORM + PostgreSQL

1. **Create Project**:
```bash
npm i -g @nestjs/cli
nest new dairy-logix-backend
cd dairy-logix-backend
npm install @nestjs/typeorm @nestjs/jwt @nestjs/passport passport-jwt typeorm pg bcrypt
```

2. **Generate Modules**:
```bash
nest g module auth
nest g module products
nest g module tenants
nest g service auth
nest g controller auth
```

---

## 📚 Additional Resources Needed

To fully complete Phase 4, you'll also need:

1. **Endpoints for**:
   - Agencies (CRUD)
   - Shopkeepers (CRUD)
   - Employees (CRUD)
   - Orders (CRUD + aggregate data for matrix view)
   - Invoices (CRUD + generation)
   - Payments (CRUD + collection tracking)
   - Deliveries (CRUD + GPS tracking)
   - Factory orders & payments
   - Reports (various types)
   - Notifications

2. **File Upload**:
   - Profile pictures
   - Product images
   - Delivery proof photos
   - Invoice PDFs

3. **WebSocket Events**:
   - Real-time order updates
   - Payment confirmations
   - Delivery status changes

---

## 💡 Pro Tips

1. **Start Simple**: Get authentication working first
2. **Use TypeScript**: Match frontend types exactly
3. **Middleware**: Validate tenant access on every request
4. **Logging**: Log all API calls for debugging
5. **Validation**: Use Joi or Zod on backend too
6. **Testing**: Write API tests as you go
7. **Documentation**: Use Swagger/OpenAPI

---

Would you like me to help implement any specific endpoint or backend architecture?
