import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middlewares/auth/auth.middleware';

const router = Router();

// Endpoint: GET /api/dashboard
router.get('/', authMiddleware, dashboardController.getDashboard);

export default router;
