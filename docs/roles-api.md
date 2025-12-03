# Roles API Documentation

This document describes the role management endpoints available in the backend API.

## Authentication & Authorization

- **List Roles**: Requires authentication (all authenticated users can view roles)
- **Create/Update Roles**: Requires authentication + `DIRECTOR` or `ADMIN` role

## System Roles vs Custom Roles

- **System Roles**: Pre-defined roles (e.g., director, admin, profesor) that cannot be modified or deleted
- **Custom Roles**: Created by administrators with custom permissions that can be updated

## Endpoints

### List Roles

Retrieves all available roles for the company, including both system roles and custom roles.

**Endpoint**: `GET /api/roles`

**Success Response** (200 OK):
```json
{
  "success": true,
  "roles": [
    {
      "id": "uuid",
      "name": "Director",
      "code": "director",
      "description": "Director del jardín infantil",
      "isSystemRole": true,
      "permissions": [
        {
          "id": "uuid",
          "name": "users.create",
          "description": "Crear usuarios"
        },
        {
          "id": "uuid",
          "name": "users.update",
          "description": "Actualizar usuarios"
        }
      ],
      "createdAt": "2025-12-01T10:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Asistente Administrativo",
      "code": "asistente_admin",
      "description": "Rol personalizado para asistentes",
      "isSystemRole": false,
      "permissions": [
        {
          "id": "uuid",
          "name": "students.view",
          "description": "Ver estudiantes"
        }
      ],
      "createdAt": "2025-12-02T14:00:00Z"
    }
  ]
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Server error

---

### Create Custom Role

Creates a new custom role with specified permissions.

**Endpoint**: `POST /api/roles`

**Request Body**:
```json
{
  "name": "Asistente Administrativo",
  "code": "asistente_admin",
  "description": "Rol personalizado para asistentes administrativos con permisos limitados",
  "permissionIds": [
    "uuid-permission-1",
    "uuid-permission-2",
    "uuid-permission-3"
  ]
}
```

**Field Requirements**:
- `name`: Minimum 2 characters
- `code`: Minimum 2 characters, only lowercase letters and underscores (e.g., `asistente_admin`)
- `description`: Minimum 10 characters
- `permissionIds`: Array of valid permission UUIDs, at least 1 required

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "Rol creado correctamente",
  "role": {
    "id": "uuid",
    "name": "Asistente Administrativo",
    "code": "asistente_admin",
    "description": "Rol personalizado para asistentes administrativos con permisos limitados",
    "isSystemRole": false,
    "permissions": [
      {
        "id": "uuid",
        "name": "students.view",
        "description": "Ver estudiantes"
      },
      {
        "id": "uuid",
        "name": "attendance.record",
        "description": "Registrar asistencia"
      }
    ]
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid data, role code already exists, or invalid permission IDs
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User doesn't have required role

---

### Update Role Permissions

Updates the permissions for a custom role. System roles cannot be modified.

**Endpoint**: `PUT /api/roles/:id`

**Request Body**:
```json
{
  "permissionIds": [
    "uuid-permission-1",
    "uuid-permission-2",
    "uuid-permission-4"
  ]
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Permisos actualizados correctamente",
  "role": {
    "id": "uuid",
    "name": "Asistente Administrativo",
    "code": "asistente_admin",
    "description": "Rol personalizado para asistentes administrativos con permisos limitados",
    "isSystemRole": false,
    "permissions": [
      {
        "id": "uuid",
        "name": "students.view",
        "description": "Ver estudiantes"
      },
      {
        "id": "uuid",
        "name": "attendance.record",
        "description": "Registrar asistencia"
      },
      {
        "id": "uuid",
        "name": "reports.generate",
        "description": "Generar reportes"
      }
    ]
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid permission IDs, role not found, or attempting to modify system role
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User doesn't have required role

---

## Available Permissions

To get a list of available permissions, you can query the permissions table or refer to the system documentation. Common permissions include:

### User Management
- `users.create` - Create users
- `users.view` - View users
- `users.update` - Update users
- `users.delete` - Delete/deactivate users

### Student Management
- `students.create` - Create students
- `students.view` - View students
- `students.update` - Update students
- `students.delete` - Delete students

### Attendance
- `attendance.record` - Record attendance
- `attendance.view` - View attendance
- `attendance.update` - Update attendance

### Reports
- `reports.generate` - Generate reports
- `reports.view` - View reports

*(This is not an exhaustive list - refer to the permissions table for all available permissions)*

---

## Data Isolation

All roles are scoped to the authenticated user's company. Custom roles created by one company are not visible to other companies.

## Notes

- System roles (`isSystemRole: true`) cannot be modified or deleted
- Role codes must be unique within each company
- Role codes should use lowercase letters and underscores only
- When updating role permissions, all existing permissions are replaced with the new set
- Deleting a role is not currently supported - consider deactivating users with that role instead
