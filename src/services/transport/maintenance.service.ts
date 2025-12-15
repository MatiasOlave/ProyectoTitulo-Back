import { AppDataSource } from "../../config/database";
import { VehicleMaintenance } from "../../entities/transport/vehicle-maintenance.entity";
import { Vehicle } from "../../entities/transport/vehicle.entity";
import { getCompanyId } from "../../utils/context";
import { CreateMaintenanceDto, MaintenanceQueryDto } from "../../dtos/transport/maintenance.dto";

export class MaintenanceService {
    private maintenanceRepo = AppDataSource.getRepository(VehicleMaintenance);
    private vehicleRepo = AppDataSource.getRepository(Vehicle);

    async findAll(query: MaintenanceQueryDto) {
        const companyId = getCompanyId();
        if (!companyId) throw new Error('Company Context missing');

        const qb = this.maintenanceRepo.createQueryBuilder('maintenance')
            .leftJoinAndSelect('maintenance.vehicle', 'vehicle')
            .where('vehicle.companyId = :companyId', { companyId });

        if (query.vehicleId) {
            qb.andWhere('maintenance.vehicleId = :vehicleId', { vehicleId: query.vehicleId });
        }

        if (query.maintenanceType) {
            qb.andWhere('maintenance.maintenanceType = :type', { type: query.maintenanceType });
        }

        if (query.startDate) {
            qb.andWhere('maintenance.serviceDate >= :startDate', { startDate: query.startDate });
        }

        if (query.endDate) {
            qb.andWhere('maintenance.serviceDate <= :endDate', { endDate: query.endDate });
        }

        qb.orderBy('maintenance.serviceDate', 'DESC');

        if (query.limit) {
            qb.take(query.limit);
        }

        if (query.offset) {
            qb.skip(query.offset);
        }

        return await qb.getMany();
    }

    async create(data: CreateMaintenanceDto, userId: string) {
        const companyId = getCompanyId();
        if (!companyId) throw new Error('Company Context missing');

        // Start Transaction
        return await AppDataSource.manager.transaction(async transactionalEntityManager => {
            // 1. Verify Vehicle exists and belongs to company
            const vehicle = await transactionalEntityManager.findOne(Vehicle, {
                where: { id: data.vehicleId, companyId }
            });

            if (!vehicle) {
                throw new Error('Vehículo no encontrado o no pertenece a su empresa.');
            }

            // 2. Create Maintenance Record
            const maintenance = transactionalEntityManager.create(VehicleMaintenance, {
                ...data, // Spread DTO fields
                performedById: userId, // Assuming current user is the "performer" or registrar
                // Ensure dates are compatible if needed, TypeORM usually handles string YYYY-MM-DD for date type
            });

            const savedMaintenance = await transactionalEntityManager.save(maintenance);

            // 3. Update Vehicle Status
            // Logic: Update mileage if greater, Update last/next maintenance dates
            let updateNeeded = false;

            // Update Current Mileage if new is higher
            if (data.mileageAtService > (vehicle.currentMileage || 0)) {
                vehicle.currentMileage = data.mileageAtService;
                vehicle.lastMileageUpdate = new Date();
                updateNeeded = true;
            }

            // Update Last Maintenance Date (assuming this new input is the latest)
            // We should check if this date is actually newer than existing LAST date?
            // User requirement implies "Tras el registro... sincronizar". Usually implies this is the latest event.
            // Simple logic: Always update last maintenance date to this one if it's recent.
            // Safer: Check if data.serviceDate >= vehicle.lastMaintenanceDate
            const serviceDateObj = new Date(data.serviceDate);
            if (!vehicle.lastMaintenanceDate || serviceDateObj >= new Date(vehicle.lastMaintenanceDate)) {
                vehicle.lastMaintenanceDate = serviceDateObj;
                updateNeeded = true;
            }

            // Update Next Maintenance Date
            if (data.nextServiceDate) {
                vehicle.nextMaintenanceDate = new Date(data.nextServiceDate);
                updateNeeded = true;
            }

            // Note: Schema doesn't have nextMaintenanceMileage in Vehicle table, so skipping that update.

            if (updateNeeded) {
                await transactionalEntityManager.save(vehicle);
            }

            return savedMaintenance;
        });
    }
}

export const maintenanceService = new MaintenanceService();
