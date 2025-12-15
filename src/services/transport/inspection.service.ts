import { AppDataSource } from "../../config/database";
import { VehicleInspection } from "../../entities/transport/vehicle-inspection.entity";
import { Vehicle } from "../../entities/transport/vehicle.entity";
import { Driver } from "../../entities/transport/driver.entity";
import { getCompanyId } from "../../utils/context";
import { CreateInspectionDto, ApproveInspectionDto } from "../../dtos/transport/inspection.dto";

export class InspectionService {
    private inspectionRepo = AppDataSource.getRepository(VehicleInspection);
    private vehicleRepo = AppDataSource.getRepository(Vehicle);
    private driverRepo = AppDataSource.getRepository(Driver);

    async create(data: CreateInspectionDto) {
        const companyId = getCompanyId();
        if (!companyId) throw new Error('Company Context missing');

        // Verify Vehicle
        const vehicle = await this.vehicleRepo.findOne({ where: { id: data.vehicleId, companyId } });
        if (!vehicle) throw new Error('Vehículo no encontrado');

        // Verify Driver
        const driver = await this.driverRepo.findOne({ where: { id: data.driverId, companyId } });
        if (!driver) throw new Error('Conductor no encontrado');

        const inspection = this.inspectionRepo.create({
            ...data,
            // driverSignatureUrl: handled by DTO or could be generated
        });

        return await this.inspectionRepo.save(inspection);
    }

    async findAll(vehicleId: string) {
        const companyId = getCompanyId();
        if (!companyId) throw new Error('Company Context missing');

        // Ensure vehicle belongs to company
        const vehicle = await this.vehicleRepo.findOne({ where: { id: vehicleId, companyId } });
        if (!vehicle) throw new Error('Vehículo no encontrado');

        return await this.inspectionRepo.find({
            where: { vehicleId },
            order: { inspectionDate: 'DESC', inspectionTime: 'DESC' },
            relations: ['driver', 'approvedBy']
        });
    }

    async findOne(id: string) {
        const companyId = getCompanyId();
        if (!companyId) throw new Error('Company Context missing');

        const inspection = await this.inspectionRepo.findOne({
            where: { id },
            relations: ['vehicle', 'driver', 'approvedBy'] // Add checklist relation if it exists in entity
        });

        if (!inspection) return null;
        if (inspection.vehicle.companyId !== companyId) return null; // Ensure isolation

        return inspection;
    }

    async approve(id: string, data: ApproveInspectionDto, userId: string) {
        const companyId = getCompanyId();
        const inspection = await this.inspectionRepo.findOne({
            where: { id },
            relations: ['vehicle']
        });

        if (!inspection || inspection.vehicle.companyId !== companyId) {
            throw new Error('Inspección no encontrada');
        }

        inspection.supervisorSignatureUrl = data.supervisorSignatureUrl || ''; // "Signed"
        inspection.approvedById = userId;
        inspection.approvedAt = new Date();
        // Maybe update overall status if rejected? but data.status is passed
        // The DTO has status, but entity has overallStatus? Or assume this is just for approval flag?
        // Check entity: entity has `approvedBy`, `approvedAt`, `supervisorSignature`. 
        // Requirements say: "Aprobación final (Booleano/Estado que requiere la firma del Supervisor)"
        // CreateInspectionDto has `overallStatus`.

        return await this.inspectionRepo.save(inspection);
    }
}

export const inspectionService = new InspectionService();
