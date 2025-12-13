import { Router } from 'express';
import { classBookController } from '../controllers/classBook.controller';
import { authMiddleware } from '../middlewares/auth/auth.middleware';

import { classBookUploadMiddleware } from '../middlewares/classBookUpload.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', classBookController.createEntry);
router.get('/', classBookController.listEntries);
router.get('/:id', classBookController.getEntryById);
router.put('/:id', classBookController.updateEntry);
router.post('/:id/observations', classBookController.addObservation);
router.post('/:id/lock', classBookController.lockEntry);
router.post('/:id/review', classBookController.reviewEntry);
router.post('/:id/files', classBookUploadMiddleware, classBookController.uploadFiles);
router.get('/:id/pdf', classBookController.exportPDF);

export default router;
