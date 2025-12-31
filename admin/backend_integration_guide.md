# Backend Integration Guide

This guide provides comprehensive documentation for integrating the Healthy Bites Online backend with the frontend application. It covers authentication, role-based access control, admin and delivery agent dashboards, frontend integration details, session management, and file structure.

## 1. Authentication Structure

### Login Process

#### Customer Login
- **Endpoint**: `POST /auth/login`
- **Request Body**:
```json
{
  "email": "customer@example.com",
  "password": "password123",
  "role": "customer"
}
```
- **Success Response**:
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "customer@example.com",
    "role": "customer"
  }
}
```

#### Admin Login
- **Endpoint**: `POST /auth/login`
- **Request Body**:
```json
{
  "email": "admin@healthy.com",
  "password": "adminpass123",
  "role": "admin"
}
```
- **Success Response**:
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": 2,
    "name": "Admin User",
    "email": "admin@healthy.com",
    "role": "admin"
  }
}
```

#### Delivery Agent Login
- **Endpoint**: `POST /auth/login`
- **Request Body**:
```json
{
  "email": "delivery@healthy.com",
  "password": "deliverypass123",
  "role": "delivery_agent"
}
```
- **Success Response**:
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": 3,
    "name": "Delivery Agent",
    "email": "delivery@healthy.com",
    "role": "delivery_agent"
  }
}
```

### Signup Process (Customer Only)
- **Endpoint**: `POST /auth/signup`
- **Request Body**:
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "securepass123",
  "phone": "+1234567890",
  "addresses": ["123 Main St, City, State 12345"]
}
```
- **Success Response**:
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": 4,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "customer",
    "phone": "+1234567890",
    "addresses": ["123 Main St, City, State 12345"]
  }
}
```

### Logout Process
- **Endpoint**: `POST /auth/logout`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Frontend Authentication Storage
- **Token Storage**: `localStorage.setItem('authToken', token)`
- **User Data Storage**: `localStorage.setItem('currentUser', JSON.stringify(user))`
- **Role Access**: `user.role` (values: "customer", "admin", "delivery_agent")

### Role-Based Redirection Rules
- **Customer**: Redirect to `customer_profile.html` after login
- **Admin**: Redirect to `admin/index.html` after login
- **Delivery Agent**: Redirect to `delivery-agent/index.html` after login

### Navbar/Header Changes
- **Unauthenticated Users**: Show "Login" (to `login.html`) and "Signup" (to `signup.html`) links in nav-links
- **Authenticated Customers**: Show "My Profile" link in nav-links, "Logout" button in actions
- **Authenticated Admins**: Show "Admin Dashboard" link in nav-links, "Logout" button in actions
- **Authenticated Delivery Agents**: Show "Delivery Dashboard" link in nav-links, "Logout" button in actions

### Authentication Pages
- **Login Page**: `login.html` - Unified login form with role selection dropdown
- **Signup Page**: `signup.html` - Customer-only signup form with name, email, phone, password fields

## 2. Role-Based Access Control (RBAC)

### Roles and Permissions

| Role | Permissions |
|------|-------------|
| customer | - View menu<br>- Add to cart<br>- Place orders<br>- View order history<br>- Update profile<br>- Manage addresses |
| admin | - All customer permissions<br>- Manage menu items<br>- View all orders<br>- Update order status<br>- Manage promotions<br>- View reports<br>- Add/remove delivery agents<br>- Add/remove other admins |
| delivery_agent | - View assigned orders<br>- Update delivery status<br>- Mark orders as delivered<br>- View delivery history |

### Backend API Checks
- **Token Validation**: Verify JWT token on protected endpoints
- **Role Verification**: Check `user.role` against required permissions
- **Error Response for Unauthorized Access**:
```json
{
  "success": false,
  "error": "Unauthorized access",
  "code": 403
}
```

### Frontend Role Information
- **Role Retrieval**: `authManager.getCurrentRole()`
- **Role Checking**: `authManager.hasRole('admin')`
- **UI Updates**: Navbar and page access controlled by `authManager.updateAuthUI()`

## 3. Admin Panel Integration

### A. Manage Menu

#### Get Menu Items
- **Endpoint**: `GET /menu`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "success": true,
  "menu": [
    {
      "id": 1,
      "name": "Stirred Egg",
      "description": "This might be the most common Chinese family dish...",
      "price": 8.99,
      "category": "main",
      "image": "media/egeswithbrade-maindish-menu.png",
      "available": true
    }
  ]
}
```

#### Add Menu Item
- **Endpoint**: `POST /menu/add`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "name": "New Dish",
  "description": "Delicious new dish description",
  "price": 12.99,
  "category": "main",
  "image": "media/new-dish.png",
  "available": true
}
```

#### Update Menu Item
- **Endpoint**: `PUT /menu/update/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "name": "Updated Dish Name",
  "price": 13.99,
  "available": false
}
```

#### Delete Menu Item
- **Endpoint**: `DELETE /menu/delete/:id`
- **Headers**: `Authorization: Bearer <token>`

### B. View Orders

#### Get Orders
- **Endpoint**: `GET /orders`
- **Query Parameters**: `?status=pending&date=2024-01-01`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "success": true,
  "orders": [
    {
      "id": "HB-123456",
      "date": "2024-01-15",
      "customer": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "items": [
        {
          "name": "Kung Pao Chicken",
          "quantity": 2,
          "price": 12.99
        }
      ],
      "total": 25.98,
      "status": "preparing",
      "address": "123 Main St, City, State 12345",
      "paymentMethod": "cod"
    }
  ]
}
```

#### Update Order Status
- **Endpoint**: `PUT /orders/:id/status`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "status": "accepted"
}
```
- **Valid Status Values**: "preparing", "accepted", "rejected", "ready", "out_for_delivery", "delivered"

### C. Manage Promotions

#### Get Promotions
- **Endpoint**: `GET /promotions`
- **Headers**: `Authorization: Bearer <token>`

#### Add Promotion
- **Endpoint**: `POST /promotions/add`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "title": "Weekend Special",
  "description": "20% off on all main dishes",
  "discount": 20,
  "type": "percentage",
  "validFrom": "2024-01-20",
  "validTo": "2024-01-21",
  "categories": ["main"]
}
```

#### Update Promotion
- **Endpoint**: `PUT /promotions/update/:id`
- **Headers**: `Authorization: Bearer <token>`

#### Delete Promotion
- **Endpoint**: `DELETE /promotions/delete/:id`
- **Headers**: `Authorization: Bearer <token>`

### D. View Reports

#### Sales Report
- **Endpoint**: `GET /reports/sales?start=2024-01-01&end=2024-01-31`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "success": true,
  "report": {
    "totalRevenue": 15432.50,
    "totalOrders": 234,
    "averageOrderValue": 65.95,
    "popularItems": [
      {"name": "Kung Pao Chicken", "orders": 45},
      {"name": "Stirred Egg", "orders": 38}
    ]
  }
}
```

#### User Report
- **Endpoint**: `GET /reports/users`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "success": true,
  "report": {
    "totalCustomers": 1250,
    "newCustomersThisMonth": 45,
    "activeUsers": 890
  }
}
```

### E. User Management

#### Add User (Admin/Delivery Agent)
- **Endpoint**: `POST /admin/add-user`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "name": "New Delivery Agent",
  "email": "agent@healthy.com",
  "password": "temppass123",
  "role": "delivery_agent",
  "phone": "+1234567890"
}
```

#### Remove User
- **Endpoint**: `DELETE /admin/remove-user/:id`
- **Headers**: `Authorization: Bearer <token>`

#### Get Users
- **Endpoint**: `GET /admin/users?role=delivery_agent`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "success": true,
  "users": [
    {
      "id": 5,
      "name": "Delivery Agent",
      "email": "agent@healthy.com",
      "role": "delivery_agent",
      "phone": "+1234567890",
      "active": true
    }
  ]
}
```

## 4. Delivery Agent Dashboard Integration

### A. View Assigned Orders
- **Endpoint**: `GET /delivery/assigned-orders`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "success": true,
  "orders": [
    {
      "id": "HB-123456",
      "date": "2024-01-15",
      "customer": {
        "name": "John Doe",
        "phone": "+1234567890"
      },
      "items": [
        {
          "name": "Kung Pao Chicken",
          "quantity": 2,
          "price": 12.99
        }
      ],
      "total": 25.98,
      "status": "out_for_delivery",
      "address": "123 Main St, City, State 12345",
      "customerPhone": "+1234567890"
    }
  ]
}
```

### B. Update Order Status
- **Endpoint**: `PUT /delivery/order/:id/update`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "status": "picked_up"
}
```
- **Valid Status Values**: "assigned", "picked_up", "out_for_delivery"

### C. Mark Order as Delivered
- **Endpoint**: `PUT /delivery/order/:id/complete`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "deliveredAt": "2024-01-15T14:30:00Z",
  "notes": "Delivered successfully"
}
```

## 5. Frontend Integration Details

### Important IDs and Classes
- **Navbar**: `.navbar`, `.nav-links`, `.actions`
- **Auth Elements**: `.auth-link`, `.logout-btn`
- **Menu Container**: `.dishes-container`, `.menu-grid`
- **Cart Elements**: `#cart-items`, `#cart-total`
- **Forms**: `#login-form`, `#signup-form`
- **Dashboard Sections**: `#manage-menu-section`, `#orders-section`, `#promotions-section`

### Dynamic Data Injection Points
- **Menu Items**: `.menu-grid` (populated by `loadMenu()`)
- **Cart Items**: `#cart-items` (populated by `cartManager.render()`)
- **Order History**: `#order-history` (populated by `loadOrderHistory()`)
- **Admin Tables**: `#menu-table`, `#orders-table` (populated by respective load functions)

### UI Update Patterns
- **After API Response**: Use `location.reload()` or targeted DOM updates
- **Loading States**: Add `.loading` class to containers during API calls
- **Error Handling**: Display errors in `.error-message` elements
- **Success Messages**: Show in `.success-message` elements

### Dashboard Toggle Behavior
- **Admin Dashboard**: Sections toggled by `showSection()` function
- **No Backend Interference**: Dashboard state managed entirely on frontend
- **URL Hash**: Used for direct navigation (`#manage-menu`, `#orders`)

### Dark/Light Mode Interaction
- **CSS Variables**: All colors use CSS custom properties
- **Class Toggle**: `document.body.classList.toggle('dark-mode')`
- **Persistence**: Stored in `localStorage.setItem('theme', 'dark')`
- **Dynamic Content**: New elements inherit theme through CSS variables

## 6. Session Management

### Backend Session Validation
- **Token Verification**: Validate JWT on every protected request
- **Expiration Check**: Return 401 if token expired
- **User Lookup**: Ensure user still exists and is active

### Token Expiration Rules
- **Expiration Time**: 24 hours from issuance
- **Refresh Mechanism**: Frontend should re-login on expiration
- **Storage**: Tokens stored in localStorage

### Failed Authentication Handling
- **Invalid Token**: Redirect to `login_signup_page.html`
- **Expired Token**: Clear localStorage, redirect to login
- **Insufficient Permissions**: Show error message, redirect to appropriate dashboard
- **Error Messages**: Display in user-friendly format

## 7. File Structure Summary

### Frontend Structure
```
admin/
├── index.html          # Admin dashboard
├── manage-menu.html    # Menu management interface
├── orders.html         # Order management
├── order-status.html   # Order status updates
├── promotions.html     # Promotion management
├── reports.html        # Reports and analytics
├── admin.js            # Admin dashboard logic
├── admin.css           # Admin styles
└── ADMIN_BACKEND_INTEGRATION_GUIDE.md

delivery-agent/
├── index.html          # Delivery dashboard
├── delivery-agent.js   # Delivery logic
├── delivery-agent.css  # Delivery styles
└── backend_integration_delivery_agent.md

js/
├── auth.js             # Authentication management
├── cart.js             # Shopping cart functionality
├── profile.js          # User profile management
└── utils.js            # Utility functions

css/
└── profile.css         # Profile page styles

Public Pages:
├── index.html          # Home page
├── menu.html           # Food menu
├── cart.html           # Shopping cart
├── checkout.html       # Order checkout
├── customer_profile.html # Customer profile
├── login.html          # Unified login page
├── signup.html         # Customer signup page
└── footer.html         # Site footer

Backend Mapping:
├── /api/auth/*         # Authentication endpoints
├── /api/menu/*         # Menu management
├── /api/orders/*       # Order management
├── /api/admin/*        # Admin operations
├── /api/delivery/*     # Delivery operations
└── /api/reports/*      # Analytics and reports
```

This guide should be updated as the backend integration progresses. All endpoints should return consistent JSON responses with `success`, `data/error`, and appropriate HTTP status codes.
