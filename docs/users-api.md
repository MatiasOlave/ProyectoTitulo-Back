# Users API Documentation

This document describes the user management endpoints available in the backend API.

## Authentication & Authorization

All endpoints require:
- **Authentication**: Valid JWT token in cookies
- **Authorization**: User must have `DIRECTOR` or `ADMIN` role

## Endpoints

### Create User

Creates a new user with basic information only. Role-specific data (student, driver, guardian) is managed separately through their respective modules.

**Endpoint**: `POST /api/users`

**Request Body**:
```json
{
  "email": "usuario@example.com",
  "password": "password123",
  "firstName": "Juan",
  "lastName": "Pérez",
  "rut": "12345678-9",
  "phone": "+56912345678",
  "roleCode": "profesor",
  "avatarUrl": "https://example.com/avatar.jpg" // Optional
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "Usuario creado correctamente",
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "rut": "12345678-9",
    "phone": "+56912345678",
    "avatarUrl": "https://example.com/avatar.jpg",
    "isActive": true,
    "role": {
      "id": "uuid",
      "name": "Profesor",
      "code": "profesor"
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid data or email/RUT already exists
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User doesn't have required role

---

### List Users

Retrieves a paginated list of users with optional filters.

**Endpoint**: `GET /api/users`

**Query Parameters**:
- `search` (optional): Search by name, email, or RUT
- `roleCode` (optional): Filter by role code
- `isActive` (optional): Filter by active status (`true` or `false`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example Request**:
```
GET /api/users?search=juan&roleCode=profesor&isActive=true&page=1&limit=10
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "users": [
    {
      "id": "uuid",
      "email": "usuario@example.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "rut": "12345678-9",
      "phone": "+56912345678",
      "avatarUrl": "https://example.com/avatar.jpg",
      "isActive": true,
      "emailVerified": false,
      "lastLoginAt": "2025-12-03T12:00:00Z",
      "createdAt": "2025-12-01T10:00:00Z",
      "roles": [
        {
          "id": "uuid",
          "name": "Profesor",
          "code": "profesor"
        }
      ]
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User doesn't have required role

---

### Get User by ID

Retrieves detailed information about a specific user.

**Endpoint**: `GET /api/users/:id`

**Success Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "rut": "12345678-9",
    "phone": "+56912345678",
    "avatarUrl": "https://example.com/avatar.jpg",
    "isActive": true,
    "emailVerified": false,
    "lastLoginAt": "2025-12-03T12:00:00Z",
    "createdAt": "2025-12-01T10:00:00Z",
    "updatedAt": "2025-12-02T15:30:00Z",
    "company": {
      "id": "uuid",
      "name": "Jardín Infantil ABC"
    },
    "roles": [
      {
        "id": "uuid",
        "name": "Profesor",
        "code": "profesor",
        "assignedAt": "2025-12-01T10:00:00Z"
      }
    ]
  }
}
```

**Error Responses**:
- `404 Not Found`: User not found or doesn't belong to the same company
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User doesn't have required role

---

### Update User

Updates user information. Password and role cannot be changed through this endpoint.

**Endpoint**: `PUT /api/users/:id`

**Request Body** (all fields optional):
```json
{
  "firstName": "Juan Carlos",
  "lastName": "Pérez González",
  "rut": "12345678-9",
  "phone": "+56987654321",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Usuario actualizado correctamente",
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "firstName": "Juan Carlos",
    "lastName": "Pérez González",
    "rut": "12345678-9",
    "phone": "+56987654321",
    "avatarUrl": "https://example.com/new-avatar.jpg",
    "isActive": true
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid data or RUT already exists
- `404 Not Found`: User not found
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User doesn't have required role

---

### Deactivate User

Performs a soft delete by setting `isActive` to `false`. The user will no longer be able to log in, but their data is preserved.

**Endpoint**: `DELETE /api/users/:id`

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Usuario desactivado correctamente"
}
```

**Error Responses**:
- `400 Bad Request`: User is already deactivated
- `404 Not Found`: User not found
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User doesn't have required role

---

### Change User Role

Changes a user's role. Removes the old role and assigns the new one.

**Endpoint**: `PATCH /api/users/:id/role`

**Request Body**:
```json
{
  "roleCode": "director"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Rol actualizado correctamente",
  "role": {
    "id": "uuid",
    "name": "Director",
    "code": "director"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid role code
- `404 Not Found`: User or role not found
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User doesn't have required role

---

## Data Isolation

All operations are automatically scoped to the authenticated user's company. Users can only manage other users within their own company (jardín).

## Notes

- Passwords are automatically hashed before storage
- Email addresses must be unique across the entire system
- RUT must be unique within each company
- When a user is created, only basic user data is stored in the `users` table
- Role-specific data (e.g., student details, driver information) must be created separately through their respective modules
