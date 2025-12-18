import { Request, Response, NextFunction } from 'express';

export const isSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
    // req.user populated by auth.middleware
    const user = (req as any).user;
    const allowedEmails = (process.env.SUPERADMIN_EMAILS || '').split(',');

    if (!user || !user.email || !allowedEmails.includes(user.email)) {
        return res.status(403).json({ message: 'Acceso Denegado: Se requieren privilegios de Superadmin.' });
    }

    // Flag for repositories/logic
    (req as any).isSuperAdmin = true;
    next();
};
