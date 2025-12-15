import { Router } from 'express';
import { CompanyController } from '../controllers/CompanyController';
import { authMiddleware } from '../middlewares/auth/auth.middleware';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../interfaces/auth/jwt.interface';

const router = Router();
const companyController = new CompanyController();

// Use auth middleware
router.use(authMiddleware);

// Helper middleware to require either DIRECTOR or ADMIN role
const requireAdminOrDirector = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
        return;
    }

    const hasRole = req.user.roles.includes('DIRECTOR') || req.user.roles.includes('ADMIN');

    if (!hasRole) {
        res.status(403).json({
            success: false,
            error: 'Access denied. Director or Administrator role required'
        });
        return;
    }

    next();
};

// Helper middleware for ADMIN only
const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
        return;
    }

    const hasRole = req.user.roles.includes('ADMIN');

    if (!hasRole) {
        res.status(403).json({
            success: false,
            error: 'Access denied. Administrator role required'
        });
        return;
    }

    next();
};

router.post('/', requireAdminOrDirector, companyController.create);
router.get('/', requireAdminOrDirector, companyController.findAll);
router.get('/:id/statistics', requireAdminOrDirector, companyController.getStatistics);
router.get('/:id', requireAdminOrDirector, companyController.getOne);
router.put('/:id', requireAdminOrDirector, companyController.update);
router.delete('/:id', requireAdmin, companyController.delete);

export default router;
