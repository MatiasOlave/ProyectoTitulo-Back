import { Router } from 'express';
import { medicalRecordController } from '../controllers/medicalRecord.controller';
import { authMiddleware as authenticate } from '../middlewares/auth/auth.middleware';
import { requireAnyRole } from '../middlewares/auth/permission.middleware';

const router = Router();

router.get('/test', (req, res) => res.json({ message: 'Medical Records Router Working' }));

// Endpoint for creating medical record
// POST /api/medical_records/:studentId
router.post(
    '/:studentId',
    authenticate,
    requireAnyRole(['ADMIN', 'DIRECTOR']),
    (req, res, next) => { console.log('DEBUG: Hit POST /medical_records/:studentId', req.params); next(); },
    medicalRecordController.createMedicalRecord
);

// Endpoint for updating medical record
// PUT /api/medical_records/:studentId
router.put(
    '/:studentId',
    authenticate,
    requireAnyRole(['ADMIN', 'DIRECTOR']),
    medicalRecordController.updateMedicalRecord
);

// Endpoint for registering consent
// POST /api/medical_records/:studentId/consent
router.post(
    '/:studentId/consent',
    authenticate,
    requireAnyRole(['ADMIN', 'DIRECTOR']),
    medicalRecordController.registerConsent
);

// Optional: GET endpoint for verification purposes or future use
router.get(
    '/:studentId',
    authenticate,
    requireAnyRole(['ADMIN', 'DIRECTOR', 'TEACHER']),
    (req, res, next) => { console.log('DEBUG: Hit GET /medical_records/:studentId', req.params); next(); },
    medicalRecordController.getMedicalRecord
);

// Report Endpoints (Point 11)
// GET /api/medical_records/:studentId/report/ficha
router.get(
    '/:studentId/report/ficha',
    authenticate,
    requireAnyRole(['ADMIN', 'DIRECTOR']),
    medicalRecordController.generateFichaReport
);

// GET /api/medical_records/:studentId/report/incidentes
router.get(
    '/:studentId/report/incidentes',
    authenticate,
    requireAnyRole(['ADMIN', 'DIRECTOR']),
    medicalRecordController.generateIncidentsReport
);

// GET /api/medical_records/:studentId/report/atenciones
router.get(
    '/:studentId/report/atenciones',
    authenticate,
    requireAnyRole(['ADMIN', 'DIRECTOR']),
    medicalRecordController.generateAttentionsReport
);

export default router;
