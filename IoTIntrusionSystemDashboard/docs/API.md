# API Documentation

## Overview
The IoT Intrusion System Dashboard provides a comprehensive RESTful API for managing devices, security alerts, and system monitoring. All API endpoints require authentication and return JSON responses.

## Authentication

### Session-based Authentication
All API endpoints require an active user session. Users must authenticate through the web interface before accessing API endpoints.

**Authentication Flow**:
1. User logs in via `/auth/login`
2. Session is established with secure cookie
3. API requests include session cookie automatically
4. Session is validated for each API request

**Error Response for Unauthenticated Requests**:
```json
{
  "success": false,
  "error": "Authentication required",
  "redirect": "/auth/login"
}
```

## Base URL
```
http://localhost:3000/api
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message"
}
```

## Devices API

### GET /api/devices
Retrieve a list of all devices with optional filtering.

**Parameters**:
- `status` (optional): Filter by device status (online, offline, alert)
- `device_type` (optional): Filter by device type
- `limit` (optional): Number of results to return (default: 50)
- `offset` (optional): Number of results to skip (default: 0)

**Request Example**:
```http
GET /api/devices?status=online&limit=10&offset=0
```

**Response Example**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Security Camera 01",
      "deviceType": "camera",
      "macAddress": "00:1B:44:11:3A:B7",
      "ipAddress": "192.168.1.100",
      "status": "online",
      "location": "Front Door",
      "firmwareVersion": "1.2.3",
      "lastSeen": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### GET /api/devices/:id
Retrieve a specific device by ID.

**Parameters**:
- `id` (required): Device ID

**Response Example**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Security Camera 01",
    "deviceType": "camera",
    "macAddress": "00:1B:44:11:3A:B7",
    "ipAddress": "192.168.1.100",
    "status": "online",
    "location": "Front Door",
    "firmwareVersion": "1.2.3",
    "lastSeen": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### POST /api/devices
Create a new device.

**Request Body**:
```json
{
  "name": "New Security Camera",
  "device_type": "camera",
  "mac_address": "00:1B:44:11:3A:B8",
  "ip_address": "192.168.1.101",
  "location": "Back Door",
  "firmware_version": "1.2.3"
}
```

**Response Example**:
```json
{
  "success": true,
  "message": "Device created successfully",
  "data": {
    "id": 2,
    "name": "New Security Camera",
    "deviceType": "camera",
    "macAddress": "00:1B:44:11:3A:B8",
    "ipAddress": "192.168.1.101",
    "status": "offline",
    "location": "Back Door",
    "firmwareVersion": "1.2.3",
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
```

### PUT /api/devices/:id
Update an existing device.

**Parameters**:
- `id` (required): Device ID

**Request Body** (all fields optional):
```json
{
  "name": "Updated Camera Name",
  "status": "online",
  "location": "New Location",
  "firmware_version": "1.2.4"
}
```

**Response Example**:
```json
{
  "success": true,
  "message": "Device updated successfully",
  "data": {
    "id": 1,
    "name": "Updated Camera Name",
    "deviceType": "camera",
    "macAddress": "00:1B:44:11:3A:B7",
    "ipAddress": "192.168.1.100",
    "status": "online",
    "location": "New Location",
    "firmwareVersion": "1.2.4",
    "lastSeen": "2024-01-15T11:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

### DELETE /api/devices/:id
Delete a device.

**Parameters**:
- `id` (required): Device ID

**Response Example**:
```json
{
  "success": true,
  "message": "Device deleted successfully"
}
```

### POST /api/devices/:id/heartbeat
Update device heartbeat (marks device as online and updates last_seen timestamp).

**Parameters**:
- `id` (required): Device ID

**Response Example**:
```json
{
  "success": true,
  "message": "Device heartbeat recorded",
  "data": {
    "lastSeen": "2024-01-15T11:30:00Z",
    "status": "online"
  }
}
```

## Security Alerts API

### GET /api/alerts
Retrieve security alerts with optional filtering.

**Parameters**:
- `status` (optional): Filter by alert status (active, investigating, resolved, false_positive)
- `severity` (optional): Filter by severity (low, medium, high, critical)
- `device_id` (optional): Filter by device ID
- `limit` (optional): Number of results to return (default: 50)
- `offset` (optional): Number of results to skip (default: 0)

**Request Example**:
```http
GET /api/alerts?status=active&severity=high&limit=10
```

**Response Example**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "alertType": "Unauthorized Access",
      "severity": "high",
      "description": "Suspicious login attempt detected",
      "sourceIp": "192.168.1.200",
      "detectedAt": "2024-01-15T10:45:00Z",
      "resolvedAt": null,
      "status": "active",
      "metadata": {
        "attempt_count": 5,
        "user_agent": "Mozilla/5.0..."
      },
      "device": {
        "name": "Security Camera 01",
        "type": "camera"
      },
      "resolvedBy": null
    }
  ]
}
```

### GET /api/alerts/:id
Retrieve a specific alert by ID.

**Parameters**:
- `id` (required): Alert ID

**Response Example**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "alertType": "Unauthorized Access",
    "severity": "high",
    "description": "Suspicious login attempt detected",
    "sourceIp": "192.168.1.200",
    "detectedAt": "2024-01-15T10:45:00Z",
    "resolvedAt": null,
    "status": "active",
    "metadata": {
      "attempt_count": 5,
      "user_agent": "Mozilla/5.0..."
    },
    "device": {
      "id": 1,
      "name": "Security Camera 01",
      "type": "camera"
    },
    "resolvedBy": {
      "id": null,
      "name": null
    }
  }
}
```

### POST /api/alerts
Create a new security alert.

**Request Body**:
```json
{
  "device_id": 1,
  "alert_type": "Suspicious Activity",
  "severity": "medium",
  "description": "Unusual network traffic detected",
  "source_ip": "192.168.1.150",
  "metadata": {
    "traffic_volume": "high",
    "protocol": "TCP"
  }
}
```

**Response Example**:
```json
{
  "success": true,
  "message": "Alert created successfully",
  "data": {
    "id": 2,
    "alertType": "Suspicious Activity",
    "severity": "medium",
    "description": "Unusual network traffic detected",
    "sourceIp": "192.168.1.150",
    "detectedAt": "2024-01-15T11:00:00Z",
    "status": "active",
    "metadata": {
      "traffic_volume": "high",
      "protocol": "TCP"
    }
  }
}
```

### PUT /api/alerts/:id/resolve
Resolve a security alert.

**Parameters**:
- `id` (required): Alert ID

**Request Body**:
```json
{
  "resolved_by": 1,
  "resolution_note": "False positive - scheduled maintenance"
}
```

**Response Example**:
```json
{
  "success": true,
  "message": "Alert resolved successfully",
  "data": {
    "id": 1,
    "status": "resolved",
    "resolvedAt": "2024-01-15T11:30:00Z",
    "resolvedBy": 1
  }
}
```

### DELETE /api/alerts/:id
Delete a security alert.

**Parameters**:
- `id` (required): Alert ID

**Response Example**:
```json
{
  "success": true,
  "message": "Alert deleted successfully"
}
```

### GET /api/alerts/stats/summary
Get alert statistics summary.

**Response Example**:
```json
{
  "success": true,
  "data": {
    "total": 150,
    "active": 12,
    "recent24h": 8,
    "severityBreakdown": {
      "low": 2,
      "medium": 5,
      "high": 3,
      "critical": 2
    }
  }
}
```

## Dashboard API

### GET /dashboard/api/stats
Get dashboard statistics.

**Response Example**:
```json
{
  "success": true,
  "data": {
    "totalDevices": 25,
    "activeThreats": 12,
    "blockedAttempts": 45,
    "systemStatus": "Active",
    "timestamp": "2024-01-15T11:30:00Z"
  }
}
```

### POST /dashboard/api/populate-sample-data
Generate sample data for testing and demonstration.

**Response Example**:
```json
{
  "success": true,
  "message": "Sample data created successfully. Refresh the dashboard to see the updated statistics."
}
```

## Error Codes

### HTTP Status Codes
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate MAC address)
- `500 Internal Server Error`: Server error

### Common Error Responses

#### Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Name and device type are required"
}
```

#### Resource Not Found
```json
{
  "success": false,
  "error": "Device not found"
}
```

#### Duplicate Resource
```json
{
  "success": false,
  "error": "Device with this MAC address already exists"
}
```

#### Server Error
```json
{
  "success": false,
  "error": "Failed to fetch devices",
  "message": "Database connection error"
}
```

## Rate Limiting

Currently, no rate limiting is implemented, but it's recommended for production use:
- Implement rate limiting based on IP address
- Different limits for different endpoint types
- Implement exponential backoff for failed requests

## API Versioning

Current API version: v1 (implicit)
Future versions will be explicitly versioned: `/api/v2/devices`

## Usage Examples

### JavaScript/Node.js Example
```javascript
// Using fetch API
const response = await fetch('/api/devices', {
  method: 'GET',
  credentials: 'include', // Include session cookie
  headers: {
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
if (data.success) {
  console.log('Devices:', data.data);
} else {
  console.error('Error:', data.error);
}
```

### cURL Examples
```bash
# Get devices (with session cookie)
curl -X GET "http://localhost:3000/api/devices" \
  -H "Content-Type: application/json" \
  -b "cookies.txt"

# Create device
curl -X POST "http://localhost:3000/api/devices" \
  -H "Content-Type: application/json" \
  -b "cookies.txt" \
  -d '{
    "name": "New Camera",
    "device_type": "camera",
    "mac_address": "00:1B:44:11:3A:B9"
  }'

# Update device status
curl -X PUT "http://localhost:3000/api/devices/1" \
  -H "Content-Type: application/json" \
  -b "cookies.txt" \
  -d '{"status": "online"}'
```

## Security Considerations

### Input Validation
- All inputs are validated server-side
- SQL injection prevention through parameterized queries
- XSS prevention through input sanitization

### Session Security
- Secure session cookies
- Session timeout configuration
- CSRF protection (recommended for production)

### Data Protection
- Sensitive data is never logged
- Password hashing with BCrypt
- Environment variable protection for secrets