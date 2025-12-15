import { Router } from 'express';
import { medicalIncidentController } from '../controllers/medicalIncident.controller';
import { authMiddleware as authenticate } from '../middlewares/auth/auth.middleware';
import { requireAnyRole } from '../middlewares/auth/permission.middleware';
import { uploadMiddleware } from '../middlewares/upload.middleware';

const router = Router();

// Endpoint for listing medical incidents (Point 9)
// GET /api/medical_incidents
// Endpoint for listing medical incidents (Point 9)
// GET /api/medical_incidents
router.get(
    '/',
    authenticate,
    requireAnyRole(['ADMIN', 'DIRECTOR', 'SUPERVISOR', 'TEACHER', 'PROFESOR']),
    medicalIncidentController.getMedicalIncidents
);

// Endpoint for creating medical incident
// POST /api/medical_incidents/:studentId
router.post(
    '/:studentId',
    authenticate,
    requireAnyRole(['ADMIN', 'DIRECTOR', 'SUPERVISOR', 'TEACHER', 'PROFESOR']),
    uploadMiddleware,
    medicalIncidentController.createMedicalIncident
);

// Endpoint for resolving/following up incident (Point 10)
// PUT /api/medical_incidents/:incidentId/follow_up
router.put(
    '/:incidentId/follow_up',
    authenticate,
    requireAnyRole(['ADMIN', 'DIRECTOR', 'SUPERVISOR', 'TEACHER', 'PROFESOR']),
    medicalIncidentController.resolveIncident
);

export default router;
