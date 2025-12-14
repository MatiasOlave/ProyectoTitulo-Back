import { Router } from 'express';
import { maintenanceController } from '../controllers/transport/maintenance.controller';
import { authMiddleware } from '../middlewares/auth/auth.middleware';
import { requireAnyRole } from '../middlewares/auth/permission.middleware';
import { companyContextMiddleware } from '../middlewares/company-context.middleware';

const router = Router();

// Apply global middlewares
router.use(authMiddleware);
router.use(companyContextMiddleware);

// GET /api/maintenance - List (Admin/Director/Supervisor/Driver)
router.get(
    '/',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE', 'SUPERVISOR', 'CONDUCTOR']),
    maintenanceController.getMaintenances.bind(maintenanceController)
);

// POST /api/maintenance - Create (Admin/Director/Supervisor) - Excludes Driver
router.post(
    '/',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE', 'SUPERVISOR']),
    maintenanceController.createMaintenance.bind(maintenanceController)
);

export default router;
