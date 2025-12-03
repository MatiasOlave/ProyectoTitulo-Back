import { Request, Response, NextFunction } from 'express';
import { runWithContext } from '../utils/context';

export const companyContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Assuming auth middleware has already populated req.user
    // We need to extend Request type or just cast it for now.
    // In a real app, we should have a custom type definition.
    const user = (req as any).user;
    const companyId = user?.companyId;

    runWithContext({ companyId }, () => {
        next();
    });
};
