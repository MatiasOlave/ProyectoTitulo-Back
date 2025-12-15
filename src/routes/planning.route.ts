import { Router } from 'express';
import { planningController } from '../controllers/planning.controller';
import { authMiddleware as authenticate } from '../middlewares/auth/auth.middleware';
import { planningUploadMiddleware } from '../middlewares/planningUpload.middleware';

const router = Router();

router.use(authenticate);

router.post('/', planningController.create);
router.get('/', planningController.getAll);
router.get('/active', planningController.getActive);
router.get('/:id', planningController.getById);
router.put('/:id', planningController.update);
router.delete('/:id', planningController.delete);

// Actions
router.post('/:id/submit', planningController.submit);
router.post('/:id/review', planningController.review);
router.post('/:id/duplicate', planningController.duplicate);
router.post('/:id/files', planningUploadMiddleware, planningController.uploadFiles);

export default router;
