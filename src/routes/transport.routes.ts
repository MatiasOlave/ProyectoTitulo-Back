import { Router } from 'express';
import { routeController } from '../controllers/transport/route.controller';
import { authMiddleware } from '../middlewares/auth/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', routeController.getRoutes);

export default router;
