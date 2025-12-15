import { Router } from 'express';
import { inspectionController } from '../controllers/transport/inspection.controller';
import { authMiddleware } from '../middlewares/auth/auth.middleware';
import { requireAnyRole } from '../middlewares/auth/permission.middleware';
import { companyContextMiddleware } from '../middlewares/company-context.middleware';

const router = Router();

router.use(authMiddleware);
router.use(companyContextMiddleware);

// GET /api/inspections - List (All relevant roles)
router.get(
    '/',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE', 'SUPERVISOR', 'CONDUCTOR']),
    inspectionController.getInspections.bind(inspectionController)
);

// GET /api/inspections/:id - Detail (All relevant roles)
router.get(
    '/:id',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE', 'SUPERVISOR', 'CONDUCTOR']),
    inspectionController.getInspection.bind(inspectionController)
);

// POST /api/inspections - Create (Driver/Admin/Supervisor)
router.post(
    '/',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE', 'SUPERVISOR', 'CONDUCTOR']),
    inspectionController.create.bind(inspectionController)
);

// PATCH /api/inspections/:id/approve - Approve (Admin/Director/Supervisor only)
router.patch(
    '/:id/approve',
    requireAnyRole(['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE', 'SUPERVISOR']),
    inspectionController.approve.bind(inspectionController)
);

export default router;
