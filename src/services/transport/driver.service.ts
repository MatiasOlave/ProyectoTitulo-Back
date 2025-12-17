import { AppDataSource } from "../../config/database";
import { Driver } from "../../entities/transport/driver.entity";
import { Vehicle } from "../../entities/transport/vehicle.entity";
import { DriverVehicleAssignment } from "../../entities/transport/driver-vehicle-assignment.entity";
import { CreateDriverDto } from "../../dtos/transport/driver.dto";
import { User } from "../../entities/auth/user.entity";
import { userService } from "../auth/user.service";
import { getCompanyId } from "../../utils/context";
import { Not, Brackets } from "typeorm";
import { DriverDocumentAlert } from "../../entities/transport/driver-document-alert.entity";
import { driverNotificationService } from "./driver-notification.service";

export class DriverService {
    private driverRepository = AppDataSource.getRepository(Driver);

    async findAll(filters: any = {}) {
        const companyId = getCompanyId();
        if (!companyId) throw new Error('Company Context missing');

        const query = this.driverRepository.createQueryBuilder('driver')
            .leftJoinAndSelect('driver.user', 'user')
            .leftJoinAndSelect('driver.city', 'city')
            // Join for filters (optional loads)
            .leftJoinAndSelect('driver.vehicleAssignments', 'assignment', 'assignment.unassignmentDate IS NULL')
            .leftJoinAndSelect('assignment.vehicle', 'vehicle')
            .where('driver.companyId = :companyId', { companyId })
            .andWhere('driver.status != :bajaStatus', { bajaStatus: 'baja' });

        // 1. Text Search (Name or RUT)
        if (filters.q) {
            query.andWhere(new Brackets(qb => {
                qb.where('driver.firstName ILIKE :q', { q: `%${filters.q}%` })
                    .orWhere('driver.lastName ILIKE :q', { q: `%${filters.q}%` })
                    .orWhere('driver.rut ILIKE :q', { q: `%${filters.q}%` });
            }));
        }

        // 2. Status Filter
        if (filters.status) {
            query.andWhere('driver.status = :status', { status: filters.status });
        }

        // 3. Vehicle Filter
        if (filters.vehicleId) {
            // Already joined assignment above for selecting, but checking logic:
            // If checking "Has ANY vehicle" or specific ID? Usually specific ID or "assigned".
            // If vehicleId is 'assigned' -> just check if assignment exists?
            // User request says "Dropdown to filter by Vehicle Assigned".
            query.andWhere('assignment.vehicleId = :vehicleId', { vehicleId: filters.vehicleId });
        }

        // 4. Alerts Filter
        if (filters.hasAlerts === 'true' || filters.hasAlerts === true) {
            query.innerJoin('driver.documentAlerts', 'alert', 'alert.isActive = true');
        }

        // 5. License Expiration Filter
        if (filters.licenseStatus) {
            const today = new Date();
            if (filters.licenseStatus === 'expired') {
                query.andWhere('driver.licenseExpirationDate < :today', { today });
            } else if (filters.licenseStatus === 'near_expiry') {
                const warningDate = new Date();
                warningDate.setDate(warningDate.getDate() + 30);
                query.andWhere('driver.licenseExpirationDate >= :today AND driver.licenseExpirationDate <= :warningDate', { today, warningDate });
            } else if (filters.licenseStatus === 'valid') {
                query.andWhere('driver.licenseExpirationDate > :today', { today });
            }
        }

        // Order by created date desc
        query.orderBy('driver.created_at', 'DESC');

        return query.getMany();
    }

    async create(data: CreateDriverDto, createdById: string) {
        const companyId = getCompanyId() || data.companyId;
        if (!companyId) throw new Error('Company ID is required');

        // 1. Create User via UserService
        // Signature: createUser(email, password, firstName, lastName, rut, phone, roleCode, createdById, avatarUrl?)
        // Password = RUT as per requirements
        const user = await userService.createUser(
            companyId,
            data.email,
            data.rut, // Password = RUT
            data.firstName,
            data.lastName,
            data.rut,
            data.phone,
            ['DRIVER'], // Role Code (must be an array)
            createdById
        );

        // 2. Create Driver Entity linked to User
        // 2. Create Driver Entity linked to User
        const driver = this.driverRepository.create({
            ...data,
            userId: user.id,
            companyId: companyId,
            status: 'active', // Default status
            // Ensuring date strings are passed directly to transformer
            birthDate: data.birthDate,
            licenseIssueDate: data.licenseIssueDate,
            licenseExpirationDate: data.licenseExpirationDate,
            hire_date: data.hireDate,
            lastMedicalExamDate: data.lastMedicalExamDate || null,
            nextMedicalExamDate: data.nextMedicalExamDate || null,
        } as any);

        return this.driverRepository.save(driver);
    }

    async findOne(id: string) {
        const companyId = getCompanyId();
        if (!companyId) throw new Error('Company Context missing');

        const driver = await this.driverRepository.findOne({
            where: { id, companyId },
            relations: [
                'user',
                'city',
                'city.region',
                'city.region.country',
                'documents',
                'vehicleAssignments',
                'vehicleAssignments.vehicle',
                'primaryRoutes',
                'primaryRoutes.vehicle',
                'backupRoutes',
                'trips',
                'documentAlerts'
            ]
        });

        if (!driver) throw new Error('Conductor no encontrado');
        return driver;
    }

    async delete(id: string) {
        // Alias to terminate with current date if called directly via old method
        return this.terminateDriver(id, new Date());
    }

    async terminateDriver(id: string, terminationDate: Date) {
        const companyId = getCompanyId();
        if (!companyId) throw new Error('Company Context missing');

        const driver = await this.driverRepository.findOne({ where: { id, companyId } });
        if (!driver) throw new Error('Conductor no encontrado');

        driver.status = 'baja';
        driver.termination_date = new Date(terminationDate).toISOString().split('T')[0];

        // Optionally deactivate user? For now just driver status as per requirements.

        return this.driverRepository.save(driver);
    }

    // --- Document Management Methods ---

    async uploadDocument(driverId: string, file: Express.Multer.File, data: any, uploadedById: string) {
        const companyId = getCompanyId();
        // Verify driver exists and belongs to company
        const driver = await this.driverRepository.findOne({ where: { id: driverId, companyId } });
        if (!driver) throw new Error('Conductor no encontrado');

        const DriverDocumentRepo = AppDataSource.getRepository('DriverDocument');

        const doc = DriverDocumentRepo.create({
            driverId: driver.id,
            documentType: data.documentType,
            documentName: data.documentName || file.originalname,
            fileUrl: file.path.replace(/\\/g, '/'), // Ensure forward slashes for URLs
            fileName: file.filename,
            fileSize: file.size,
            mimeType: file.mimetype,
            issueDate: data.issueDate ? new Date(data.issueDate) : null,
            expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
            isPermanent: data.isPermanent === 'true' || data.isPermanent === true,
            uploadedById: uploadedById,
            uploadedAt: new Date(),
            status: 'valid', // Initial status, will be recalculated
            verified: false
        });

        // Calculate initial status based on expiry
        if (!doc.isPermanent && doc.expiryDate) {
            const today = new Date();
            if (doc.expiryDate < today) {
                doc.status = 'vencido';
            } else if (doc.expiryDate.getTime() - today.getTime() < 30 * 24 * 60 * 60 * 1000) { // 30 days warn
                doc.status = 'por vencer';
            }
        }

        return DriverDocumentRepo.save(doc);
    }

    async getDocuments(driverId: string) {
        const companyId = getCompanyId();
        const driver = await this.driverRepository.findOne({ where: { id: driverId, companyId } });
        if (!driver) throw new Error('Conductor no encontrado o acceso denegado');

        const DriverDocumentRepo = AppDataSource.getRepository('DriverDocument');
        const documents = await DriverDocumentRepo.find({
            where: { driverId },
            order: { uploadedAt: 'DESC' },
            relations: ['uploadedBy', 'verifiedBy']
        });

        // Dynamically update status on fetch (optional, but good for real-time validity)
        // Or we rely on a cron job. For now, let's just return what's in DB or recalc lightly.
        return documents.map(doc => {
            // Recalculate status for display if not permanent
            if (!doc.isPermanent && doc.expiryDate) {
                const today = new Date();
                const expiry = new Date(doc.expiryDate);
                if (expiry < today) {
                    doc.status = 'vencido';
                } else if (expiry.getTime() - today.getTime() < 30 * 24 * 60 * 60 * 1000) {
                    doc.status = 'por vencer';
                } else {
                    doc.status = 'valid';
                }
            }
            return doc;
        });
    }

    async verifyDocument(docId: string, verifierId: string, notes: string) {
        const DriverDocumentRepo = AppDataSource.getRepository('DriverDocument');
        const doc = await DriverDocumentRepo.findOne({
            where: { id: docId },
            relations: ['driver']
        });

        if (!doc) throw new Error('Documento no encontrado');

        // Security check: Ensure driver belongs to current company context
        const companyId = getCompanyId();
        const driver = await this.driverRepository.findOne({ where: { id: doc.driverId, companyId } });
        if (!driver) throw new Error('Acceso denegado al documento');

        doc.verified = true;
        doc.verifiedById = verifierId;
        doc.verifiedAt = new Date();
        doc.verificationNotes = notes;

        return DriverDocumentRepo.save(doc);
    }

    async deleteDocument(docId: string) {
        const DriverDocumentRepo = AppDataSource.getRepository('DriverDocument');
        const doc = await DriverDocumentRepo.findOne({
            where: { id: docId },
            relations: ['driver']
        });
        if (!doc) throw new Error('Documento no encontrado');

        // Security check
        const companyId = getCompanyId();
        const driver = await this.driverRepository.findOne({ where: { id: doc.driverId, companyId } });
        if (!driver) throw new Error('Acceso denegado al documento');

        // Option: Delete file from filesystem too
        // import fs from 'fs';
        // if (fs.existsSync(doc.fileUrl)) fs.unlinkSync(doc.fileUrl);

        return DriverDocumentRepo.remove(doc);
    }

    // --- Alert Management Methods ---

    async getAlerts(userId: string) {
        const companyId = getCompanyId();
        const userRepo = AppDataSource.getRepository('User');
        const user = await userRepo.findOne({ where: { id: userId }, relations: ['userRoles', 'userRoles.role'] });
        if (!user) throw new Error('Usuario no encontrado');

        const DriverDocumentAlertRepo = AppDataSource.getRepository('DriverDocumentAlert');

        const isDriver = user.userRoles.some((ur: any) => ur.role.code === 'DRIVER');
        const isAdmin = user.userRoles.some((ur: any) => ['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE'].includes(ur.role.code));

        let whereClause: any = { companyId, isActive: true };

        if (isAdmin) {
            // Admins see all active alerts for company
        } else if (isDriver) {
            // Drivers see only their own alerts
            // We need to find the Driver entity for this User
            const driver = await this.driverRepository.findOne({ where: { userId: userId, companyId } });
            if (!driver) return []; // Or throw error
            whereClause.driverId = driver.id;
        } else {
            return []; // Other roles don't see alerts?
        }

        const alerts = await DriverDocumentAlertRepo.find({
            where: whereClause,
            relations: ['driver', 'document'],
            order: { severity: 'DESC', daysUntilExpiry: 'ASC' }
            // Severity: Critical > Urgent > Warning? Needs careful sorting or custom sort. 
            // String sort: 'urgent' > 'warning' > 'critical'? No. 
            // Let's just sort by daysUntilExpiry ASC (most urgent first)
        });

        // Manual sort for severity if needed, but daysUntilExpiry is good proxy.
        // Or we can rely on frontend sorting. 
        return alerts;
    }

    async acknowledgeAlert(alertId: string, userId: string) {
        const DriverDocumentAlertRepo = AppDataSource.getRepository('DriverDocumentAlert');
        const alert = await DriverDocumentAlertRepo.findOne({ where: { id: alertId } });
        if (!alert) throw new Error('Alerta no encontrada');

        // Security: Company check
        const companyId = getCompanyId();
        if (alert.companyId !== companyId) throw new Error('Acceso denegado');

        // Security: User check (Role based or ownership)
        // Admin can ACK any. Driver can ACK own.
        // We trust the service caller to have checked generic Auth, but we check specific ownership here?
        // Let's assume admins and owners can ACK.

        alert.acknowledged = true;
        alert.acknowledgedById = userId;
        alert.acknowledgedAt = new Date();

        return DriverDocumentAlertRepo.save(alert);
    }

    async resolveAlert(alertId: string, userId: string) {
        const DriverDocumentAlertRepo = AppDataSource.getRepository('DriverDocumentAlert');
        const alert = await DriverDocumentAlertRepo.findOne({ where: { id: alertId } });
        if (!alert) throw new Error('Alerta no encontrada');

        const companyId = getCompanyId();
        if (alert.companyId !== companyId) throw new Error('Acceso denegado');

        alert.resolved = true;
        alert.resolvedById = userId;
        alert.resolvedAt = new Date();
        alert.isActive = false;
        alert.resolutionNotes = 'Resuelto manualmente (Documento Renovado)';

        return DriverDocumentAlertRepo.save(alert);
    }

    async update(id: string, data: Partial<CreateDriverDto>, userId: string) {
        const companyId = getCompanyId();
        const driver = await this.driverRepository.findOne({ where: { id, companyId }, relations: ['user'] });

        if (!driver) throw new Error('Conductor no encontrado');
        if (driver.status === 'baja') throw new Error('No se puede editar un conductor dado de baja');

        // Prevent modifying restricted fields
        if (data.rut && data.rut !== driver.rut) {
            throw new Error('No se puede modificar el RUT del conductor.');
        }

        // Update User (Email/First/Last) if changed
        if (data.email || data.firstName || data.lastName) {
            const userRepo = AppDataSource.getRepository('User');
            const user = driver.user;
            if (user) {
                if (data.email) user.email = data.email;
                if (data.firstName) user.firstName = data.firstName;
                if (data.lastName) user.lastName = data.lastName;
                await userRepo.save(user);
            }
        }

        // Update Driver Fields
        // Filter out restricted fields from data before assigning
        const updateData = { ...data };
        delete (updateData as any).rut;
        delete (updateData as any).userId;
        delete (updateData as any).companyId;
        delete (updateData as any).id;
        delete (updateData as any).user; // Don't try to link user object directly if passed

        Object.assign(driver, updateData);

        // Clean undefined values from object assign if any (Object.assign copies undefined)
        // Better approach: Assign explicit allowed fields or use merge if careful. 
        // For simplicity with Partial, checking fields:

        if (data.firstName) driver.firstName = data.firstName;
        if (data.lastName) driver.lastName = data.lastName;
        if (data.birthDate) driver.birthDate = data.birthDate;
        if (data.phone) driver.phone = data.phone;
        if (data.phoneSecondary) driver.phoneSecondary = data.phoneSecondary;
        if (data.address) driver.address = data.address;
        if (data.address) driver.address = data.address;

        // Fix Persistence: Prevent TypeORM from preferring old loaded 'city' relation over new 'cityId'
        if (data.cityId) {
            driver.cityId = data.cityId;
            driver.city = null as any; // Force unlinking of old city object
        }

        // Emergency Contact
        if (data.emergencyContactName) driver.emergencyContactName = data.emergencyContactName;
        if (data.emergencyContactRelationship) driver.emergencyContactRelationship = data.emergencyContactRelationship;
        if (data.emergencyContactPhone) driver.emergencyContactPhone = data.emergencyContactPhone;
        if (data.emergencyContactPhoneSecondary) driver.emergencyContactPhoneSecondary = data.emergencyContactPhoneSecondary;

        // License
        if (data.licenseNumber) driver.licenseNumber = data.licenseNumber;
        if (data.licenseType) driver.licenseType = data.licenseType;
        if (data.licenseIssueDate) driver.licenseIssueDate = data.licenseIssueDate;
        if (data.licenseExpirationDate) driver.licenseExpirationDate = data.licenseExpirationDate;
        if (data.licenseRestrictions) driver.licenseRestrictions = data.licenseRestrictions;
        if (data.yearsOfExperience !== undefined) driver.yearsOfExperience = data.yearsOfExperience;
        if (data.previousExperience) driver.previousExperience = data.previousExperience;

        // Medical
        if (data.lastMedicalExamDate) driver.lastMedicalExamDate = data.lastMedicalExamDate;
        if (data.nextMedicalExamDate) driver.nextMedicalExamDate = data.nextMedicalExamDate;
        if (data.medicalRestrictions) driver.medicalRestrictions = data.medicalRestrictions;

        // Contractual
        if (data.hireDate) driver.hire_date = data.hireDate;

        return this.driverRepository.save(driver);
    }

    async suspendDriver(driverId: string, data: { reason: string; startDate: Date | string; endDate: Date | string }, userId: string) {
        const companyId = getCompanyId();
        const driver = await this.driverRepository.findOne({ where: { id: driverId, companyId }, relations: ['user'] });
        if (!driver) throw new Error('Conductor no encontrado');

        // Update Driver Status
        driver.status = 'suspendido';
        driver.suspensionReason = data.reason;

        // Ensure dates are converted to strings YYYY-MM-DD
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Fechas de suspensión inválidas');
        }

        driver.suspensionStartDate = startDate.toISOString().split('T')[0];
        driver.suspensionEndDate = endDate.toISOString().split('T')[0];

        // Log who suspended (could use a separate audit log, but relying on entities for now)
        // driver.updatedBy = userId; // If we had this field

        await this.driverRepository.save(driver);

        // Notify Driver and Admin
        try {
            if (driver.email) {
                await driverNotificationService.sendSuspensionNotification(
                    driver.email,
                    driver.firstName,
                    data.reason,
                    startDate,
                    endDate
                );
            }

            // Notify Admins (Optional, based on requirements "Notificación Automática... al chofer afectado y al administrador")
            // Assuming current user is the admin acting, maybe notify via system notification or just return success.
            // For now, email to driver is the critical part defined.
        } catch (error) {
            console.error('Error sending suspension notification:', error);
            // Don't rollback transaction just for email failure
        }

        return driver;
    }

    // Public method for other modules to check availability
    async validateDriverAvailability(driverId: string, date: Date = new Date()) {
        const driver = await this.driverRepository.findOne({ where: { id: driverId } });
        if (!driver) throw new Error('Conductor no encontrado');

        if (driver.status === 'suspendido') {
            const checkDateString = date.toISOString().split('T')[0];
            const start = driver.suspensionStartDate; // Already string YYYY-MM-DD via transformer
            const end = driver.suspensionEndDate;     // Already string YYYY-MM-DD via transformer

            if (start && end && checkDateString >= start && checkDateString <= end) {
                throw new Error(`El conductor está suspendido desde ${start} hasta ${end}. Motivo: ${driver.suspensionReason}`);
            }
        }
        return true;
    }

    // --- Vehicle Assignment Methods ---

    async getAvailableVehicles() {
        const companyId = getCompanyId();
        if (!companyId) throw new Error('Company Context missing');

        const vehicleRepo = AppDataSource.getRepository(Vehicle);
        const vehicles = await vehicleRepo.find({
            where: {
                companyId,
                status: 'active'
            },
            select: ['id', 'brand', 'model', 'licensePlate', 'internalCode', 'year']
        });

        return vehicles;
    }

    async assignVehicle(driverId: string, data: { vehicleId: string; isPrimary: boolean; assignmentDate: Date }, assignedById: string) {
        const companyId = getCompanyId();
        const driver = await this.driverRepository.findOne({ where: { id: driverId, companyId } });
        if (!driver) throw new Error('Conductor no encontrado');

        if (driver.status === 'suspendido' || driver.status === 'baja') {
            throw new Error('No se puede asignar vehículo a un conductor suspendido o dado de baja.');
        }

        const vehicleRepo = AppDataSource.getRepository(Vehicle);
        const vehicle = await vehicleRepo.findOne({ where: { id: data.vehicleId, companyId } });
        if (!vehicle) throw new Error('Vehículo no encontrado');

        const assignmentRepo = AppDataSource.getRepository(DriverVehicleAssignment);

        // Check if already assigned active
        const existing = await assignmentRepo.findOne({
            where: {
                driverId: driverId,
                vehicleId: data.vehicleId,
                unassignmentDate: undefined // or IsNull() if using TypeORM operator
            } as any
        });

        if (existing) {
            throw new Error('El conductor ya tiene asignado este vehículo.');
        }

        // Check if vehicle already has a primary driver
        if (data.isPrimary) {
            const currentPrimary = await assignmentRepo.findOne({
                where: {
                    vehicleId: data.vehicleId,
                    isPrimaryDriver: true,
                    unassignmentDate: undefined // or IsNull()
                } as any
            });

            if (currentPrimary && currentPrimary.driverId !== driverId) {
                throw new Error('Este vehículo ya tiene un conductor principal asignado.');
            }
        }

        const assignment = assignmentRepo.create({
            driverId: driverId,
            vehicleId: data.vehicleId,
            isPrimaryDriver: data.isPrimary,
            assignmentDate: new Date(data.assignmentDate),
            assignedById: assignedById
        });

        return assignmentRepo.save(assignment);
    }

    async unassignVehicle(assignmentId: string, data: { unassignmentDate: Date; reason: string }, unassignedById: string) {
        const assignmentRepo = AppDataSource.getRepository(DriverVehicleAssignment);
        const assignment = await assignmentRepo.findOne({
            where: { id: assignmentId },
            relations: ['driver'] // to check company if needed
        });

        if (!assignment) throw new Error('Asignación no encontrada');

        const companyId = getCompanyId();
        // Since assignment doesn't have companyId directly, check via driver
        // Assuming driver is loaded or we lazy load.
        // We need to verify permissions.
        const driver = await this.driverRepository.findOne({ where: { id: assignment.driverId, companyId } });
        if (!driver) throw new Error('Acceso denegado a la asignación');

        if (assignment.unassignmentDate) {
            throw new Error('La asignación ya ha sido finalizada.');
        }

        assignment.unassignmentDate = new Date(data.unassignmentDate);
        assignment.unassignmentReason = data.reason;
        assignment.unassignedById = unassignedById;

        return assignmentRepo.save(assignment);
    }
}

export const driverService = new DriverService();
