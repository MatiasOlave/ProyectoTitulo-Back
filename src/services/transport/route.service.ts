import { getScopedRepository } from '../../utils/scoped-repository';
import { Route } from '../../entities/transport/route.entity';

export const routeService = {
    async getRoutes(companyId: string) {
        const routeRepo = getScopedRepository(Route);
        // Use query builder to ensure company scope (though getScopedRepository should handle it, explicit is safer as seen before)
        return await routeRepo.createQueryBuilder('route')
            .where('route.companyId = :companyId', { companyId })
            .andWhere('route.isActive = :isActive', { isActive: true })
            .select(['route.id', 'route.name', 'route.description'])
            .orderBy('route.name', 'ASC')
            .getMany();
    }
};
