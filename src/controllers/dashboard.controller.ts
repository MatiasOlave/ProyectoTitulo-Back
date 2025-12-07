import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { User } from '../entities/auth/user.entity';
import { AppDataSource } from '../config/database';

export const dashboardController = {
    async getDashboard(req: Request, res: Response) {
        try {
            // User from middleware is the JWT Payload
            const userPayload = (req as any).user;

            if (!userPayload?.userId) {
                return res.status(401).json({ error: 'Usuario no autenticado' });
            }

            // Fetch full user entity for the service
            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOne({
                where: { id: userPayload.userId },
                relations: ['company']
            });

            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            const roles: string[] = userPayload.roles || [];
            if (roles.length === 0) {
                return res.status(403).json({ error: 'Usuario sin roles asignados' });
            }

            let targetRole = '';
            if (roles.includes('ADMIN')) targetRole = 'ADMIN';
            else if (roles.includes('DIRECTOR')) targetRole = 'DIRECTOR';
            else if (roles.includes('TEACHER')) targetRole = 'TEACHER';
            else if (roles.includes('DRIVER')) targetRole = 'DRIVER';
            else if (roles.includes('GUARDIAN')) targetRole = 'GUARDIAN';
            else targetRole = roles[0];

            const companyId = user.company.id; // User entity has company relation loaded

            const data = await dashboardService.getDashboardData(user, companyId, targetRole);

            return res.json(data);

        } catch (error: any) {
            console.error('Error fetching dashboard data:', error);
            return res.status(500).json({ error: 'Error interno o rol no soportado' });
        }
    }
};
