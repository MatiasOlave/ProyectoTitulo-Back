import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';

import { authMiddleware } from '../middlewares/auth/auth.middleware';
import { companyContextMiddleware } from '../middlewares/company-context.middleware';
import { requireAnyRole } from '../middlewares/auth/permission.middleware';

const router = Router();
const paymentController = new PaymentController();

router.use(authMiddleware);
router.use(companyContextMiddleware);

// Create payment preference
// Payload: { companyId: string } (optional if using user context)
router.post('/preference', requireAnyRole(['ADMIN', 'DIRECTOR']), paymentController.createPreference);

export default router;
