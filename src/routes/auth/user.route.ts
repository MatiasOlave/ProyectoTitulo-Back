// src/routes/auth/user.route.ts
import { Router } from 'express';
import { userController } from '../../controllers/auth/user.controller';
import { authMiddleware } from '../../middlewares/auth/auth.middleware';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../interfaces/auth/jwt.interface';

import { companyContextMiddleware } from '../../middlewares/company-context.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);
router.use(companyContextMiddleware);

// Helper middleware to require either DIRECTOR or ADMIN role
const requireAdminOrDirector = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: 'Autenticación requerida'
        });
        return;
    }

    const hasRole = req.user.roles.includes('DIRECTOR') || req.user.roles.includes('ADMIN');

    if (!hasRole) {
        res.status(403).json({
            success: false,
            error: 'Acceso denegado. Se requiere rol de Director o Administrador'
        });
        return;
    }

    next();
};

// User management routes - all require DIRECTOR or ADMIN role
router.get('/role-counts', requireAdminOrDirector, userController.getRoleCounts);
router.post('/', requireAdminOrDirector, userController.createUser);
router.get('/', requireAdminOrDirector, userController.listUsers);
router.get('/:id', requireAdminOrDirector, userController.getUserById);
router.put('/:id', requireAdminOrDirector, userController.updateUser);
router.delete('/:id', requireAdminOrDirector, userController.deleteUser);
router.patch('/:id/role', requireAdminOrDirector, userController.changeUserRole);
router.patch('/:id/toggle-status', requireAdminOrDirector, userController.toggleUserStatus);

export default router;

