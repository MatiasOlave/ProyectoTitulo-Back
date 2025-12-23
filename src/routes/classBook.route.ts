import { Router } from 'express';
import { classBookController } from '../controllers/classBook.controller';
import { authMiddleware } from '../middlewares/auth/auth.middleware';

import { classBookUploadMiddleware } from '../middlewares/classBookUpload.middleware';

const router = Router();

router.use(authMiddleware);


router.post('/books', classBookController.createBook);
router.get('/books', classBookController.listBooks);
router.get('/books/:id', classBookController.getBookById);
router.put('/books/:id', classBookController.updateBook);
router.delete('/books/:id', classBookController.deleteBook);

router.post('/', classBookController.createEntry);
router.get('/', classBookController.listEntries); // Can filter by bookId
router.get('/:id', classBookController.getEntryById);

router.put('/:id', classBookController.updateEntry);
router.delete('/:id', classBookController.deleteEntry);
router.post('/:id/observations', classBookController.addObservation);
router.post('/:id/lock', classBookController.lockEntry);
router.post('/:id/review', classBookController.reviewEntry);
router.post('/:id/files', classBookUploadMiddleware, classBookController.uploadFiles);
router.get('/:id/pdf', classBookController.exportPDF);

export default router;
