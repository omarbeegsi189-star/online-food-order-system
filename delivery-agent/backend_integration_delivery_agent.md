# Backend Integration Guide for Delivery Agent Dashboard

## Overview
This guide provides detailed instructions for integrating the Delivery Agent Dashboard with your backend API. The dashboard is designed to be modular and ready for backend integration, with placeholder functions and clear data hooks.

## File Structure

```
delivery-agent/
├── index.html              # Main dashboard HTML structure
├── delivery-agent.css      # Dashboard styling (mirrors admin.css)
├── delivery-agent.js       # Dashboard functionality and API calls
├── TODO.md                 # Development tasks and progress
└── backend_integration_delivery_agent.md  # This integration guide
```

## Key Features
- **View Assigned Orders**: Display list of orders assigned to the delivery agent
- **Update Delivery Status**: Change order status via dropdown
- **Mark as Delivered**: Quick action button to mark orders as delivered
- **Logout**: Secure logout functionality
- **Theme Toggle**: Dark/light mode switching
- **Responsive Design**: Works on all devices

## JavaScript Functions

### Core Functions
- `initializeDashboard()`: Sets up the dashboard on page load
- `switchSection(sectionId)`: Switches between dashboard sections
- `loadAssignedOrders()`: Fetches and displays assigned orders
- `updateOrderStatus(orderId, newStatus)`: Updates order status via API
- `markOrderAsDelivered(orderId)`: Marks order as delivered via API
- `handleLogout()`: Handles user logout
- `updateOrderStatusUI(orderId, newStatus)`: Updates UI after status change
- `renderAssignedOrders(orders)`: Renders orders list from API data
- `showNotification(message)`: Displays user notifications

### Event Handlers
- Sidebar toggle (hamburger menu)
- Navigation between sections
- Status dropdown changes
- Mark as delivered button clicks
- Logout button click

## API Endpoints Required

### 1. Get Assigned Orders
**Endpoint:** `GET /api/delivery-agent/orders`

**Purpose:** Fetch all orders assigned to the current delivery agent

**Response Format:**
```json
{
  "success": true,
  "orders": [
    {
      "id": "12345",
      "customerName": "John Doe",
      "address": "123 Main St, City, State 12345",
      "items": ["Grilled Chicken Salad", "Fresh Juice"],
      "deliveryTime": "2024-01-15T14:00:00Z",
      "status": "processing",
      "total": 18.50,
      "phone": "+1234567890"
    }
  ]
}
```

**Integration Point:** Replace the placeholder in `loadAssignedOrders()` function

### 2. Update Order Status
**Endpoint:** `PUT /api/orders/{orderId}/status`

**Purpose:** Update the delivery status of a specific order

**Request Body:**
```json
{
  "status": "out_for_delivery"
}
```

**Valid Status Values:**
- `processing`
- `out_for_delivery`
- `delivered`
- `returned`

**Response Format:**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "order": {
    "id": "12345",
    "status": "out_for_delivery"
  }
}
```

**Integration Point:** Replace the placeholder in `updateOrderStatus()` function

### 3. Mark Order as Delivered
**Endpoint:** `POST /api/orders/{orderId}/deliver`

**Purpose:** Mark a specific order as delivered (sets status to 'delivered')

**Response Format:**
```json
{
  "success": true,
  "message": "Order marked as delivered",
  "order": {
    "id": "12345",
    "status": "delivered",
    "deliveredAt": "2024-01-15T14:30:00Z"
  }
}
```

**Integration Point:** Replace the placeholder in `markOrderAsDelivered()` function

### 4. Logout
**Endpoint:** `POST /api/auth/logout`

**Purpose:** Log out the delivery agent and invalidate session

**Response Format:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Integration Point:** Replace the placeholder in `handleLogout()` function

## Data Format Specifications

### Order Object
```javascript
{
  id: string,              // Unique order identifier
  customerName: string,    // Customer's full name
  address: string,         // Delivery address
  items: array,            // Array of item names
  deliveryTime: string,    // ISO 8601 datetime string
  status: string,          // Current delivery status
  total: number,           // Order total amount
  phone: string           // Customer phone number (optional)
}
```

### Status Values
- `"processing"`: Order is being prepared
- `"out_for_delivery"`: Order is on the way
- `"delivered"`: Order has been delivered successfully
- `"returned"`: Order was returned/undeliverable

## Status Update Workflow

1. **User selects new status** from dropdown in order card
2. **Frontend calls** `updateOrderStatus(orderId, newStatus)`
3. **API request** sent to `PUT /api/orders/{orderId}/status`
4. **Backend validates** status transition (e.g., can't go back from 'delivered')
5. **Database updated** with new status and timestamp
6. **Response sent** back to frontend
7. **UI updated** via `updateOrderStatusUI()` function
8. **Notification shown** to user

## Authentication Notes

### Session Management
- Delivery agent must be authenticated before accessing dashboard
- Include authentication token in API requests (e.g., Authorization header)
- Redirect to login page on authentication failure

### Token Handling Example
```javascript
// Add to fetch requests
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`
};

fetch('/api/delivery-agent/orders', { headers })
  .then(response => {
    if (response.status === 401) {
      // Token expired, redirect to login
      window.location.href = '/login';
    }
    return response.json();
  });
```

### Logout Implementation
1. Call logout API endpoint
2. Clear local storage/session storage
3. Remove authentication tokens
4. Redirect to login page

## Error Handling

### API Error Response Format
```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE"  // Optional error code
}
```

### Frontend Error Handling
```javascript
fetch('/api/endpoint')
  .then(response => response.json())
  .then(data => {
    if (!data.success) {
      showNotification(data.error || 'An error occurred');
      return;
    }
    // Process successful response
  })
  .catch(error => {
    console.error('Network error:', error);
    showNotification('Network error. Please try again.');
  });
```

## UI Data Hooks

### HTML Attributes for API Integration
- `data-order-id`: Identifies order elements
- `data-section`: Identifies dashboard sections
- `id="assigned-orders-list"`: Container for orders list
- `class="status-dropdown"`: Status update dropdowns
- `class="mark-delivered-btn"`: Deliver action buttons

### CSS Classes for Status Display
- `status processing`
- `status out-for-delivery`
- `status delivered`
- `status returned`

## Testing Checklist

- [ ] Orders load correctly on dashboard load
- [ ] Status dropdown updates reflect in UI immediately
- [ ] Mark as delivered button works correctly
- [ ] Logout clears session and redirects
- [ ] Error messages display properly
- [ ] Responsive design works on mobile/tablet
- [ ] Theme toggle persists across sessions
- [ ] Sidebar toggle hides/shows correctly

## Deployment Notes

1. **File Paths**: Update image paths in HTML if necessary
2. **CORS**: Ensure backend allows requests from dashboard domain
3. **HTTPS**: Use HTTPS in production for security
4. **Caching**: Implement appropriate caching for static assets
5. **Monitoring**: Add error tracking and performance monitoring

## Support
For questions or issues with backend integration, refer to the placeholder functions in `delivery-agent.js` and the API specifications above.
