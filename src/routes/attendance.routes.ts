import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth/auth.middleware';
import { requireAnyRole } from '../middlewares/auth/permission.middleware';
import { companyContextMiddleware } from '../middlewares/company-context.middleware';
import { attendanceController } from '../controllers/attendance.controller';

const router = Router();

router.use(authMiddleware);
router.use(companyContextMiddleware);

// Read endpoints
router.get('/', attendanceController.getAttendance);
router.get('/alerts', attendanceController.getAlerts);
router.get('/export', attendanceController.exportReport);

// Write endpoints
router.post('/bulk', requireAnyRole(['ADMIN', 'TEACHER', 'DIRECTOR']), attendanceController.bulkRegister);
router.put('/:id', requireAnyRole(['ADMIN', 'TEACHER', 'DIRECTOR']), attendanceController.updateAttendance);
router.patch('/lock', requireAnyRole(['ADMIN', 'DIRECTOR']), attendanceController.lockAttendance); // Only admin/director

// Alert management
router.patch('/alerts/:id/resolve', requireAnyRole(['ADMIN', 'DIRECTOR', 'TEACHER']), attendanceController.resolveAlert);
router.post('/alerts/:id/notify', requireAnyRole(['ADMIN', 'DIRECTOR', 'TEACHER']), attendanceController.notify);

// Uploads
import { attendanceUploadMiddleware } from '../middlewares/attendanceUpload.middleware';
router.post('/upload', requireAnyRole(['ADMIN', 'TEACHER', 'DIRECTOR']), attendanceUploadMiddleware, attendanceController.upload);

export default router;
