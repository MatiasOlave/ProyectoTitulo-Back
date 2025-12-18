import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';

export class PaymentController {
    private paymentService: PaymentService;

    constructor() {
        this.paymentService = new PaymentService();
    }

    createPreference = async (req: Request, res: Response) => {
        try {
            // Get companyId from the authenticated user
            // Assuming authMiddleware populates req.user
            const user = (req as any).user;
            const companyId = user?.companyId;

            if (!companyId) {
                return res.status(403).json({
                    success: false,
                    message: 'User is not associated with any company'
                });
            }

            const result = await this.paymentService.createMonthlyPaymentPreference(companyId);

            return res.status(200).json({
                success: true,
                message: 'Payment preference created successfully',
                data: result
            });
        } catch (error: any) {
            console.error('Payment Error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Error processing payment request'
            });
        }
    }
}
