import { AppDataSource } from '../../config/database';
import { Route } from '../../entities/transport/route.entity';
import { RouteStop } from '../../entities/transport/route-stop.entity';
import { CreateRouteDto, UpdateRouteDto } from '../../dtos/transport/route.dto';
import { getScopedRepository } from '../../utils/scoped-repository';
import { Brackets } from 'typeorm';

export const routeService = {
    async getRoutes(companyId: string, filters?: { search?: string; status?: string; driverId?: string; isActive?: boolean }) {
        const routeRepo = getScopedRepository(Route);
        const query = routeRepo.createQueryBuilder('route')
            .leftJoinAndSelect('route.vehicle', 'vehicle')
            .leftJoinAndSelect('route.primaryDriver', 'driver')
            .where('route.companyId = :companyId', { companyId });

        if (filters?.search) {
            query.andWhere(new Brackets(qb => {
                qb.where('route.name ILIKE :search', { search: `%${filters.search}%` })
                    .orWhere('route.code ILIKE :search', { search: `%${filters.search}%` });
            }));
        }

        if (filters?.status) {
            query.andWhere('route.status = :status', { status: filters.status });
        }

        if (filters?.driverId) {
            query.andWhere('route.primaryDriverId = :driverId', { driverId: filters.driverId });
        }

        if (filters?.isActive !== undefined) {
            query.andWhere('route.isActive = :isActive', { isActive: filters.isActive });
        }

        // Default: Show active unless asked otherwise? 
        // Logic: Backend usually returns what is requested. 
        // But if isActive is not passed, maybe we typically show active? 
        // Let's stick to filters if present. If not present, maybe no filter on isActive? 
        // The previous code had .andWhere('route.isActive = :isActive', { isActive: true }).
        // I will keep showing ALL unless filter says otherwise, OR default to true if that's the convention.
        // User asked for "Soft Delete" visibility.
        // Let's default isActive=true only if filter is NOT provided at all? No, let's let controller handle or default here.
        // If filters are completely undefined, let's DEFAULT to Active routes to keep list clean.
        if (filters?.isActive === undefined) {
            query.andWhere('route.isActive = true');
        }

        return await query.orderBy('route.name', 'ASC').getMany();
    },

    async getRouteById(id: string, companyId: string) {
        const routeRepo = getScopedRepository(Route);
        return await routeRepo.createQueryBuilder('route')
            .leftJoinAndSelect('route.vehicle', 'vehicle')
            .leftJoinAndSelect('route.primaryDriver', 'driver')
            .leftJoinAndSelect('route.stops', 'stops')
            .where('route.id = :id', { id })
            .andWhere('route.companyId = :companyId', { companyId })
            .orderBy('stops.stopOrder', 'ASC')
            .getOne();
    },

    async createRoute(data: CreateRouteDto, companyId: string, userId: string) {
        if (!data.vehicleId) throw new Error('Debe asignar un vehículo.');
        if (!data.primaryDriverId) throw new Error('Debe asignar un conductor principal.');

        if (data.stops?.length) {
            data.stops.forEach((stop, index) => {
                if (!stop.studentId) {
                    throw new Error(`La parada #${index + 1} debe tener un estudiante asignado.`);
                }
            });
        }

        return await AppDataSource.transaction(async manager => {
            // Derive start/end from stops
            const startStop = data.stops?.[0];
            const endStop = data.stops?.[data.stops.length - 1];

            const route = manager.create(Route, {
                companyId,
                name: data.name,
                description: data.description,
                vehicleId: data.vehicleId,
                primaryDriverId: data.primaryDriverId,
                backupDriverId: data.backupDriverId,
                notifyGuardiansOnStart: data.notifyGuardiansOnStart ?? true,
                notifyGuardiansOnApproach: data.notifyGuardiansOnApproach ?? true,
                approachNotificationDistanceMeters: data.approachNotificationDistanceMeters || 500,
                createdById: userId,
                isActive: true, // Default
                status: 'active',

                // Mapped not-null fields
                startAddress: startStop?.address || 'Sin dirección de inicio',
                startLocationName: startStop?.stopName || 'Inicio',
                startLatitude: startStop?.latitude || 0,
                startLongitude: startStop?.longitude || 0,

                endAddress: endStop?.address || 'Sin dirección de término',
                endLocationName: endStop?.stopName || 'Fin',
                endLatitude: endStop?.latitude || 0,
                endLongitude: endStop?.longitude || 0,

                // Required dummy/defaults for strict schema
                routeType: 'school_transport',
                scheduledStartTime: '08:00', // Defaults
                scheduledEndTime: '17:00',
                estimatedDurationMinutes: 0,
                estimatedDistanceKm: 0
            });

            const savedRoute = await manager.save(route);

            if (data.stops && data.stops.length > 0) {
                const stopsEntities = data.stops.map((stop, index) => manager.create(RouteStop, {
                    routeId: savedRoute.id,
                    stopOrder: index + 1,
                    address: stop.address,
                    latitude: stop.latitude,
                    longitude: stop.longitude,
                    stopName: stop.stopName || `Parada ${index + 1}`,
                    estimatedTimeFromStartMinutes: stop.estimatedTimeFromStartMinutes || (index * 15),
                    authorizedGuardians: [], // Default empty
                    createdById: userId,
                    isActive: true,
                    // Defaults for strict schema
                    studentId: stop.studentId || undefined, // If provided
                }));
                await manager.save(stopsEntities);
                savedRoute.stops = stopsEntities;
            }

            return savedRoute;
        });
    },

    async updateRoute(id: string, data: UpdateRouteDto, companyId: string) {
        if (data.stops?.length) {
            data.stops.forEach((stop, index) => {
                if (!stop.studentId) {
                    throw new Error(`La parada #${index + 1} debe tener un estudiante asignado.`);
                }
            });
        }

        return await AppDataSource.transaction(async manager => {
            // Verify existence and company scope manually since manager is unscoped
            const existingRoute = await manager.findOne(Route, { where: { id, companyId } });
            if (!existingRoute) throw new Error('Ruta no encontrada o acceso denegado.');

            // Update simple fields
            manager.merge(Route, existingRoute, {
                name: data.name,
                description: data.description,
                vehicleId: data.vehicleId,
                primaryDriverId: data.primaryDriverId,
                backupDriverId: data.backupDriverId,
                notifyGuardiansOnStart: data.notifyGuardiansOnStart,
                notifyGuardiansOnApproach: data.notifyGuardiansOnApproach,
                approachNotificationDistanceMeters: data.approachNotificationDistanceMeters,
                status: data.status
            });

            // Update Start/End if stops change
            if (data.stops && data.stops.length > 0) {
                const startStop = data.stops[0];
                const endStop = data.stops[data.stops.length - 1];
                existingRoute.startAddress = startStop.address;
                existingRoute.startLatitude = startStop.latitude;
                existingRoute.startLongitude = startStop.longitude;
                existingRoute.endAddress = endStop.address;
                existingRoute.endLatitude = endStop.latitude;
                existingRoute.endLongitude = endStop.longitude;
            }

            const savedRoute = await manager.save(existingRoute);

            // Access RouteStops
            if (data.stops) {
                // Hard delete old stops and replace? Or update?
                // For simplicity and correctness with order: Remove all for this route and re-create is easiest for "Full Edit" forms.
                await manager.delete(RouteStop, { routeId: id });

                const stopsEntities = data.stops.map((stop, index) => manager.create(RouteStop, {
                    routeId: savedRoute.id,
                    stopOrder: index + 1,
                    address: stop.address,
                    latitude: stop.latitude,
                    longitude: stop.longitude,
                    stopName: stop.stopName || `Parada ${index + 1}`,
                    estimatedTimeFromStartMinutes: stop.estimatedTimeFromStartMinutes || (index * 15),
                    authorizedGuardians: [],
                    isActive: true,
                    studentId: stop.studentId // Fixed: Persistence of studentId
                }));
                await manager.save(stopsEntities);
                savedRoute.stops = stopsEntities;
            }

            return savedRoute;
        });
    },

    async deleteRoute(id: string, companyId: string) {
        const repo = getScopedRepository(Route);
        const route = await repo.findOne({ where: { id } });
        if (!route) throw new Error('Route not found');

        route.isActive = false;
        route.status = 'inactive';
        return await repo.save(route);
    },

    async toggleStatus(id: string, companyId: string) {
        const repo = getScopedRepository(Route);
        const route = await repo.findOne({ where: { id } });
        if (!route) throw new Error('Route not found');

        route.status = route.status === 'active' ? 'inactive' : 'active';
        return await repo.save(route);
    }
};
