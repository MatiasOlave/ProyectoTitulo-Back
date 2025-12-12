import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth/auth.middleware';
import { companyContextMiddleware } from '../middlewares/company-context.middleware';
import { requireAnyRole } from '../middlewares/auth/permission.middleware';
import { studentController } from '../controllers/student.controller';

const router = Router();

router.use(authMiddleware);
router.use(companyContextMiddleware);

// Roles permitidos para gestionar estudiantes (Lectura)
// Roles permitidos para gestionar estudiantes (Lectura)
// Roles permitidos para gestionar estudiantes (Lectura)
const READ_ROLES = ['ADMIN', 'DIRECTOR', 'TEACHER'];
// Roles permitidos para modificar (Escritura)
const WRITE_ROLES = ['ADMIN', 'DIRECTOR'];

router.post('/enroll', requireAnyRole(WRITE_ROLES), studentController.createStudent);
router.post('/', requireAnyRole(WRITE_ROLES), studentController.createStudent);
router.get('/', requireAnyRole(READ_ROLES), studentController.listStudents);
router.get('/:id/profile', requireAnyRole(READ_ROLES), studentController.getStudentProfile);
router.get('/:id/guardians', requireAnyRole(READ_ROLES), studentController.getStudentGuardians);
router.get('/:id', requireAnyRole(READ_ROLES), studentController.getStudentById);
router.put('/:id', requireAnyRole(WRITE_ROLES), studentController.updateStudent);
router.delete('/:id', requireAnyRole(WRITE_ROLES), studentController.deleteStudent);

// Quick Actions
router.post('/:id/attendance', requireAnyRole(READ_ROLES), studentController.recordAttendance);
router.post('/:id/medical-incident', requireAnyRole(READ_ROLES), studentController.recordMedicalIncident);
router.post('/:id/observation', requireAnyRole(READ_ROLES), studentController.addObservation);
router.get('/:id/class-book', requireAnyRole(READ_ROLES), studentController.getClassBook);
router.get('/:id/medical-record', requireAnyRole(READ_ROLES), studentController.getMedicalRecord);

// Emergency Contacts
router.post('/:id/contacts', requireAnyRole(WRITE_ROLES), studentController.addContact);
router.put('/:id/contacts/:contactId', requireAnyRole(WRITE_ROLES), studentController.updateContact);
router.delete('/:id/contacts/:contactId', requireAnyRole(WRITE_ROLES), studentController.deleteContact);

export default router;
