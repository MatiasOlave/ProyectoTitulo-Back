// src/routes/auth/role.route.ts
import { Router } from 'express';
import { roleController } from '../../controllers/auth/role.controller';
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

// Role management routes
router.get('/', authMiddleware, roleController.listRoles); // All authenticated users can view roles
router.post('/', requireAdminOrDirector, roleController.createRole); // Only DIRECTOR/ADMIN can create
router.put('/:id', requireAdminOrDirector, roleController.updateRolePermissions); // Only DIRECTOR/ADMIN can update

export default router;
