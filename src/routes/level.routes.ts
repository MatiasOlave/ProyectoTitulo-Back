import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth/auth.middleware';
import { companyContextMiddleware } from '../middlewares/company-context.middleware';
import { levelController } from '../controllers/level.controller';

const router = Router();

router.use(authMiddleware);
router.use(companyContextMiddleware);

router.get('/', levelController.listLevels);

export default router;
