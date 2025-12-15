import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth/auth.middleware';
import { companyContextMiddleware } from '../../middlewares/company-context.middleware';
import { requireAnyRole } from '../../middlewares/auth/permission.middleware';
import { guardianController } from '../../controllers/students/guardian.controller';

const router = Router();

// ==========================================
// PUBLIC ROUTES (No authentication required)
// ==========================================
router.get('/invite/validate/:token', guardianController.validateInvitation);
router.post('/invite/accept/:token', guardianController.acceptInvitation);

// ==========================================
// PROTECTED ROUTES
// ==========================================
router.use(authMiddleware);
router.use(companyContextMiddleware);

// Role definitions
const MANAGE_ROLES = ['ADMIN', 'DIRECTOR'];
const READ_ROLES = ['ADMIN', 'DIRECTOR', 'TEACHER', 'GUARDIAN'];

// CRUD Operations
router.post('/', requireAnyRole(MANAGE_ROLES), guardianController.create);
router.get('/', requireAnyRole(READ_ROLES), guardianController.list);
router.get('/:id', requireAnyRole(READ_ROLES), guardianController.getById);
router.put('/:id', requireAnyRole(MANAGE_ROLES), guardianController.update);
router.delete('/:id', requireAnyRole(MANAGE_ROLES), guardianController.delete);

// Student Linkage
router.post('/:id/students', requireAnyRole(MANAGE_ROLES), guardianController.linkStudent);
router.get('/:id/students', requireAnyRole(READ_ROLES), guardianController.getGuardianStudents);
router.put('/links/:linkId', requireAnyRole(MANAGE_ROLES), guardianController.updateLink);
router.delete('/links/:linkId', requireAnyRole(MANAGE_ROLES), guardianController.unlinkStudent);

// Invitation
router.post('/:id/invite', requireAnyRole(MANAGE_ROLES), guardianController.sendInvitation);

// Consent Management
router.patch('/:id/consents', requireAnyRole(MANAGE_ROLES), guardianController.updateConsents);

// Permission Management
router.patch('/:id/permissions', requireAnyRole(MANAGE_ROLES), guardianController.updatePermissions);

export default router;
