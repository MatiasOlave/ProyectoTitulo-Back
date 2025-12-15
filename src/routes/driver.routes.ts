import { Router } from 'express';
import { driverController } from '../controllers/transport/driver.controller';
import { authMiddleware } from '../middlewares/auth/auth.middleware';
import { requireAnyRole, requireRole } from '../middlewares/auth/permission.middleware';
import { companyContextMiddleware } from '../middlewares/company-context.middleware';

const router = Router();

// Apply global middlewares for this router
router.use(authMiddleware);
router.use(companyContextMiddleware);

// Routes
// GET /api/drivers - List all (Restricted checks done in Controller/Service context or here if needed)
// Assuming standard users in company can view list OR restrict to Admin/Director/Drivers? 
// User request said: "Listado simple... al que accede el rol Conductor". 
// And "Admin/Director" use it too? 
// I'll keep it open to Auth users, but Service filters by Company.
// GET /api/drivers - List all (Restricted to Admin/Director/Supervisor and Conductor)
router.get(
    '/',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE']),
    driverController.getDrivers
);

// POST /api/drivers - Create (Admin/Director only)
router.post(
    '/',
    requireAnyRole(['ADMIN', 'DIRECTOR']),
    driverController.createDriver
);

// --- Alert Routes (Must be before /:id) ---

// GET /api/drivers/alerts/active - List active alerts (Admin/Driver)
router.get(
    '/alerts/active',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE', 'DRIVER']),
    driverController.getAlerts
);

// POST /api/drivers/:id/suspend - Suspend driver
router.post(
    '/:id/suspend',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE']),
    driverController.suspendDriver
);

// PATCH /api/drivers/alerts/:alertId/acknowledge
router.patch(
    '/alerts/:alertId/acknowledge',
    driverController.acknowledgeAlert
);

// POST /api/drivers/alerts/:alertId/resolve
router.post(
    '/alerts/:alertId/resolve',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE']),
    driverController.resolveAlert
);


// --- Vehicle Assignment Routes ---

// GET /api/drivers/available-vehicles - List available vehicles
router.get(
    '/available-vehicles',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE']),
    driverController.listAvailableVehicles
);

// POST /api/drivers/:id/assignments - Assign vehicle
router.post(
    '/:id/assignments',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE']),
    driverController.assignVehicle
);

// POST /api/drivers/assignments/:assignmentId/unassign - Unassign vehicle
router.post(
    '/assignments/:assignmentId/unassign',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE']),
    driverController.unassignVehicle
);


// GET /api/drivers/:id - Detail (Auth users within company, explicit roles)
router.get(
    '/:id',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE', 'DRIVER']),
    driverController.getDriver
);

// DELETE /api/drivers/:id - Soft Delete (Admin only)
router.delete(
    '/:id',
    requireAnyRole(['ADMIN', 'DIRECTOR']),
    driverController.deleteDriver
);

// --- Document Routes ---

// GET /api/drivers/:id/documents - List documents
router.get(
    '/:id/documents',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE', 'DRIVER']),
    driverController.getDocuments
);

// POST /api/drivers/:id/documents - Upload document
// Requires Multer middleware for file 'file'
import { driverUploadMiddleware } from '../middlewares/driver-upload.middleware';

router.post(
    '/:id/documents',
    // Allow Admins, Supervisors? User request: "Admin/Supervisor".
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE']), // Adjust roles as per system
    driverUploadMiddleware,
    driverController.uploadDocument
);

// PATCH /api/drivers/documents/:docId/verify - Verify document
router.patch(
    '/documents/:docId/verify',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE']),
    driverController.verifyDocument
);

// DELETE /api/drivers/documents/:docId - Delete document
// DELETE /api/drivers/documents/:docId - Delete document
router.delete(
    '/documents/:docId',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE']),
    driverController.deleteDocument
);

// --- Alert Routes ---

// GET /api/drivers/alerts/active - List active alerts (Admin/Driver)
router.get(
    '/alerts/active',
    driverController.getAlerts
);

// POST /api/drivers/:id/suspend - Suspend driver
router.post(
    '/:id/suspend',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE']),
    driverController.suspendDriver
);

// PATCH /api/drivers/alerts/:alertId/acknowledge
router.patch(
    '/alerts/:alertId/acknowledge',
    driverController.acknowledgeAlert
);

// POST /api/drivers/alerts/:alertId/resolve
router.post(
    '/alerts/:alertId/resolve',
    // Resolve usually done by Admins or maybe Driver if they upload doc? 
    // Plan: Alerts are resolved via UI "Resolve" button which calls Upload -> Then specific Resolve endpoint.
    // Or auto-resolve. 
    // Requirement says: "Admin: Confirm and Resolve". "Driver: Confirm only"? 
    // "Chofer: Solo puede ver y confirmar".
    // So Resolve is Admin/Supervisor only.
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE']),
    driverController.resolveAlert
);

// POST /api/drivers/:id/terminate - Terminate driver 'Baja' (Soft Delete)
router.post(
    '/:id/terminate',
    requireAnyRole(['ADMIN', 'DIRECTOR']), // Only Admin can terminate
    driverController.terminateDriver
);


// PUT /api/drivers/:id - Update Driver (Admin/Director)
router.put(
    '/:id',
    requireAnyRole(['ADMIN', 'DIRECTOR']),
    driverController.updateDriver
);

export default router;
