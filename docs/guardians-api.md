# Guardian API Documentation

## Overview
API endpoints for managing guardians (apoderados) in the system. Includes CRUD operations, student linkage, invitation system, consent management, and permission controls.

## Base URL
`/api/guardians`

## Authentication
Most endpoints require authentication via JWT token and company context middleware. Public endpoints are noted below.

## Role-Based Access Control
- **MANAGE_ROLES**: `ADMIN`, `DIRECTOR` - Full CRUD and management access
- **READ_ROLES**: `ADMIN`, `DIRECTOR`, `TEACHER`, `GUARDIAN` - Read-only access

---

## Endpoints

### 1. Create Guardian
Create a new guardian profile.

**Endpoint:** `POST /api/guardians`  
**Auth Required:** Yes (ADMIN, DIRECTOR)

**Request Body:**
```json
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "rut": "12345678-9",
  "email": "juan.perez@example.com",
  "phone": "+56912345678",
  "phoneSecondary": "+56987654321",
  "relationship": "Padre",
  "address": "Calle Falsa 123, Santiago",
  "cityId": "uuid-ciudad",
  "occupation": "Ingeniero",
  "workplace": "Empresa XYZ",
  "workPhone": "+56223456789",
  "preferredContactMethod": "email",
  "contactTimePreference": "Mañanas",
  "isPrimary": true,
  "isAuthorizedPickup": true,
  "isEmergencyContact": true,
  "isAuthorizedMedicalDecisions": true,
  "photoConsent": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "Juan",
    "lastName": "Pérez",
    ...
  }
}
```

---

### 2. List Guardians
Get a paginated list of guardians with optional filters.

**Endpoint:** `GET /api/guardians`  
**Auth Required:** Yes (ADMIN, DIRECTOR, TEACHER, GUARDIAN)

**Query Parameters:**
- `search` (string, optional): Search by name, email, RUT, or phone
- `isPrimary` (boolean, optional): Filter by primary guardian
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)

**Example:** `GET /api/guardians?search=juan&page=1&limit=10`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "juan.perez@example.com",
      "phone": "+56912345678",
      "isPrimary": true,
      "hasUser": true,
      ...
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### 3. Get Guardian by ID
Get complete guardian profile including linked students.

**Endpoint:** `GET /api/guardians/:id`  
**Auth Required:** Yes (ADMIN, DIRECTOR, TEACHER, GUARDIAN)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "Juan",
    "lastName": "Pérez",
    "rut": "12345678-9",
    "email": "juan.perez@example.com",
    "phone": "+56912345678",
    "address": "Calle Falsa 123",
    "city": {
      "id": "uuid",
      "name": "Santiago"
    },
    "user": {
      "id": "uuid",
      "email": "juan.perez@example.com"
    },
    "studentGuardians": [
      {
        "id": "uuid",
        "student": {
          "id": "uuid",
          "fullName": "María Pérez"
        },
        "relationshipType": "Padre",
        "priority": 1,
        "canPickup": true,
        "canReceiveCommunications": true,
        "canAuthorizeMedical": true,
        "canSeeAcademicInfo": true,
        "hasLegalCustody": true,
        "custodyType": "Compartida",
        "livesWithStudent": true
      }
    ],
    ...
  }
}
```

---

### 4. Update Guardian
Update guardian information.

**Endpoint:** `PUT /api/guardians/:id`  
**Auth Required:** Yes (ADMIN, DIRECTOR)

**Request Body:** (All fields optional)
```json
{
  "firstName": "Juan Carlos",
  "phone": "+56911111111",
  "address": "Nueva Dirección 456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "Juan Carlos",
    ...
  }
}
```

---

### 5. Delete Guardian (Soft Delete)
Soft delete a guardian. Sets `deleted_at` timestamp.

**Endpoint:** `DELETE /api/guardians/:id`  
**Auth Required:** Yes (ADMIN, DIRECTOR)

**Response:**
```json
{
  "success": true,
  "message": "Apoderado eliminado correctamente"
}
```

---

## Student Linkage

### 6. Link Student to Guardian
Create a relationship between a guardian and a student with specific permissions.

**Endpoint:** `POST /api/guardians/:id/students`  
**Auth Required:** Yes (ADMIN, DIRECTOR)

**Request Body:**
```json
{
  "studentId": "uuid-estudiante",
  "relationshipType": "Madre",
  "priority": 1,
  "canPickup": true,
  "canReceiveCommunications": true,
  "canAuthorizeMedical": true,
  "canSeeAcademicInfo": true,
  "hasLegalCustody": true,
  "custodyType": "Exclusiva",
  "custodyNotes": "Notas adicionales sobre custodia",
  "livesWithStudent": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-link",
    "guardianId": "uuid",
    "studentId": "uuid",
    "relationshipType": "Madre",
    "priority": 1,
    ...
  }
}
```

---

### 7. Get Guardian's Students
Get all students linked to a guardian.

**Endpoint:** `GET /api/guardians/:id/students`  
**Auth Required:** Yes (ADMIN, DIRECTOR, TEACHER, GUARDIAN)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-link",
      "student": {
        "id": "uuid",
        "fullName": "María Pérez",
        "rut": "98765432-1"
      },
      "relationshipType": "Padre",
      "priority": 1,
      "canPickup": true,
      ...
    }
  ]
}
```

---

### 8. Update Student-Guardian Link
Update permissions and relationship details for a specific link.

**Endpoint:** `PUT /api/guardians/links/:linkId`  
**Auth Required:** Yes (ADMIN, DIRECTOR)

**Request Body:**
```json
{
  "canPickup": false,
  "canAuthorizeMedical": false,
  "priority": 2
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-link",
    "canPickup": false,
    "canAuthorizeMedical": false,
    ...
  }
}
```

---

### 9. Unlink Student from Guardian
Remove the relationship between a guardian and student (soft delete).

**Endpoint:** `DELETE /api/guardians/links/:linkId`  
**Auth Required:** Yes (ADMIN, DIRECTOR)

**Response:**
```json
{
  "success": true,
  "message": "Vinculación eliminada correctamente"
}
```

---

## Invitation & User Account Creation

### 10. Send Invitation
Send an email invitation to a guardian to create their user account.

**Endpoint:** `POST /api/guardians/:id/invite`  
**Auth Required:** Yes (ADMIN, DIRECTOR)

**Response:**
```json
{
  "success": true,
  "message": "Invitación enviada correctamente",
  "expiresAt": "2025-12-14T18:00:00.000Z"
}
```

---

### 11. Validate Invitation Token
Validate an invitation token (PUBLIC - no auth required).

**Endpoint:** `GET /api/guardians/invite/validate/:token`  
**Auth Required:** No

**Response:**
```json
{
  "valid": true,
  "guardian": {
    "id": "uuid",
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@example.com",
    "rut": "12345678-9",
    "phone": "+56912345678",
    "companyName": "Jardín Infantil ABC"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Token de invitación inválido"
}
```

---

### 12. Accept Invitation
Accept invitation and create user account (PUBLIC - no auth required).

**Endpoint:** `POST /api/guardians/invite/accept/:token`  
**Auth Required:** No

**Request Body:**
```json
{
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cuenta creada y vinculada exitosamente",
  "user": {
    "id": "uuid",
    "email": "juan.perez@example.com",
    "firstName": "Juan",
    "lastName": "Pérez"
  }
}
```

---

## Consent Management

### 13. Update Consents
Update guardian consents for data usage and photo permissions.

**Endpoint:** `PATCH /api/guardians/:id/consents`  
**Auth Required:** Yes (ADMIN, DIRECTOR)

**Request Body:**
```json
{
  "dataConsentGiven": true,
  "photoConsent": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "dataConsentGiven": true,
    "dataConsentDate": "2025-12-12T18:00:00.000Z",
    "photoConsent": true,
    ...
  }
}
```

---

## Permission Management

### 14. Update Permissions
Update global guardian permissions (not student-specific).

**Endpoint:** `PATCH /api/guardians/:id/permissions`  
**Auth Required:** Yes (ADMIN, DIRECTOR)

**Request Body:**
```json
{
  "isAuthorizedPickup": true,
  "isAuthorizedMedicalDecisions": true,
  "isEmergencyContact": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isAuthorizedPickup": true,
    "isAuthorizedMedicalDecisions": true,
    "isEmergencyContact": true,
    ...
  }
}
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description"
}
```

**Common HTTP Status Codes:**
- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid input or validation error
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Data Isolation

All endpoints enforce company-level data isolation using the `companyContextMiddleware`. Guardians can only access and manage data within their assigned company.

## Notes

1. **Multiple Students**: A guardian can be linked to multiple students (e.g., siblings in the same institution).
2. **Permission Hierarchy**: 
   - Global permissions on `Guardian` entity apply to all students
   - Student-specific permissions on `StudentGuardian` entity override global settings for that student
3. **Soft Delete**: Deleted guardians are not permanently removed but marked with `deleted_at` timestamp
4. **Invitation Flow**: 
   - Admin/Director sends invitation → Guardian receives email → Guardian validates token → Guardian accepts and creates account
   - Token expires after 48 hours
5. **User Role**: When a guardian accepts an invitation, a User account is created with the `GUARDIAN` role
