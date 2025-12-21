import { Router } from 'express';
import { routeController } from '../controllers/transport/route.controller';
import { authMiddleware } from '../middlewares/auth/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', routeController.getRoutes);
router.get('/:id', routeController.getRouteById);
router.post('/', routeController.createRoute);
router.put('/:id', routeController.updateRoute);
router.delete('/:id', routeController.deleteRoute);
router.patch('/:id/toggle-status', routeController.toggleStatus);

export default router;
