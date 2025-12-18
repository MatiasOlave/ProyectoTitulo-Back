# Sistema de Pagos - Documentación

Este documento describe la implementación del backend para el sistema de pagos utilizando Mercado Pago Checkout API, diseñado para cobrar una mensualidad a los jardines basada en su matrícula de estudiantes.

## Resumen del Modelo de Cobro

*   **Tarifa Base**: $1200 CLP por estudiante.
*   **Impuesto (IVA)**: 19%.
*   **Cálculo Final**: ($1200 + 19%) * Cantidad de Estudiantes Activos.
*   **Valor Unitario por Estudiante**: $1428 CLP.

## Arquitectura

El sistema utiliza:
*   **Service**: `PaymentService` (`src/services/payment.service.ts`) - Encapsula la lógica de negocio, conteo de estudiantes y comunicación con Mercado Pago.
*   **Controller**: `PaymentController` (`src/controllers/payment.controller.ts`) - Maneja las peticiones HTTP.
*   **Router**: `PaymentRoutes` (`src/routes/payment.routes.ts`) - Define los endpoints.

## Endpoints

### 1. Generar Preferencia de Pago

Este endpoint debe ser llamado cuando el usuario (Director/Admin) desea realizar el pago de la mensualidad.

*   **URL**: `/api/payments/preference`
*   **Método**: `POST`
*   **Autenticación**: **Requerida** (Token Bearer). Solo roles `ADMIN` o `DIRECTOR`.
*   **Contexto**: El `companyId` se obtiene automáticamente del usuario autenticado.

#### Request Body

El cuerpo puede ir vacío, ya que la compañía se infiere del token.

```json
{}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Payment preference created successfully",
  "data": {
    "preferenceId": "12345678-abcd-...",
    "initPoint": "https://www.mercadopago.cl/checkout/v1/redirect?...",
    "sandboxInitPoint": "https://sandbox.mercadopago.cl/checkout/v1/redirect?...",
    "details": {
      "studentCount": 15,
      "unitPrice": 1428,
      "totalAmount": 21420,
      "currency": "CLP"
    }
  }
}
```

#### Response (400 Bad Request)
Si falta el `companyId`.

#### Response (500 Internal Server Error)
Si falla la conexión con Mercado Pago o la base de datos.

## Lógica de Negocio Detallada

1.  **Validación**: Se verifica que la compañía exista.
2.  **Conteo**: Se cuentan los registros en la tabla `students` donde:
    *   `company_id` coincide.
    *   `status` es 'active'.
    *   No está eliminado (soft delete).
3.  **Generación**: Se crea una preferencia en Mercado Pago con un ítem que refleja la cantidad de estudiantes.
4.  **Respuesta**: Se entregan los links para redirigir al usuario a la pasarela de pago.

## Configuración

Asegúrese de tener las siguientes variables en `.env`:
*   `MP_ACCESS_TOKEN`: Token de producción o prueba de Mercado Pago.
*   `MP_PUBLIC_KEY`: (Opcional para este flujo backend).

## Próximos pasos sugeridos (Fuera del alcance actual)

1.  **Webhooks**: Implementar un endpoint para recibir notificaciones de Mercado Pago (`/api/payments/webhook`) para confirmar cuando el pago se realice exitosamente.
2.  **Registro de Transacción**: Guardar el registro del pago en la base de datos (Entidad `CompanySubscription` o nueva entidad `PaymentTransaction`) al recibir la confirmación.
3.  **Frontend**: Crear el botón que llame a este endpoint y redirija al `initPoint`.
