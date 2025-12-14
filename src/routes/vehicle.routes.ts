import { Router } from 'express';
import { vehicleController } from '../controllers/transport/vehicle.controller';
import { authMiddleware } from '../middlewares/auth/auth.middleware';
import { requireAnyRole } from '../middlewares/auth/permission.middleware';
import { companyContextMiddleware } from '../middlewares/company-context.middleware';

const router = Router();

// Apply global middlewares
router.use(authMiddleware);
router.use(companyContextMiddleware);

// GET /api/vehicles - List all (Restricted to Admin/Direct/Supervisor as per navbar requirement?)
// Navbar says visible for Admin, Supervisor, Director.
// I will apply the same restriction here.
router.get(
    '/',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE', 'SUPERVISOR', 'DRIVER']),
    vehicleController.getVehicles.bind(vehicleController)
);

// GET /api/vehicles/:id - Detail
router.get('/:id', requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE', 'SUPERVISOR', 'CONDUCTOR']), vehicleController.getVehicle.bind(vehicleController));

// Alerts for vehicle
router.get('/:id/alerts', requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE', 'SUPERVISOR', 'CONDUCTOR']), vehicleController.getAlerts.bind(vehicleController));

// Inspections history for vehicle
router.get('/:id/inspections', requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE', 'SUPERVISOR', 'CONDUCTOR', 'DRIVER']), vehicleController.getInspections.bind(vehicleController));

// Update Vehicles - Create (Admin/Supervisor/Director)
router.post(
    '/',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE', 'SUPERVISOR']),
    vehicleController.createVehicle.bind(vehicleController)
);

// GET /api/vehicles/:id - Detail
router.get(
    '/:id',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE', 'SUPERVISOR', 'DRIVER']),
    vehicleController.getVehicle.bind(vehicleController)
);

// Update Mileage - Admin/Supervisor/Director
router.patch(
    '/:id/mileage',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE', 'SUPERVISOR']),
    vehicleController.updateMileage.bind(vehicleController)
);

// Update Vehicle - Admin/Supervisor/Director
router.put(
    '/:id',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE', 'SUPERVISOR']),
    vehicleController.updateVehicle.bind(vehicleController)
);

router.delete(
    '/:id',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE', 'SUPERVISOR']),
    vehicleController.deleteVehicle.bind(vehicleController)
);

export default router;
