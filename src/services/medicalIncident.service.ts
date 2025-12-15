import { AppDataSource } from '../config/database';
import { MedicalIncident } from '../entities/medical/medical-incident.entity';
import { Student } from '../entities/students/student.entity';
import { StudentGuardian } from '../entities/students/student-guardian.entity';
import { getScopedRepository } from '../utils/scoped-repository';
import { Between, Like, FindOptionsWhere } from 'typeorm';

export const medicalIncidentService = {
    async getMedicalIncidents(
        companyId: string,
        filters: {
            studentId?: string;
            incidentType?: string;
            severity?: string;
            dateStart?: string;
            dateEnd?: string;
            limit?: number;
            offset?: number;
        }
    ) {
        const incidentRepo = AppDataSource.getRepository(MedicalIncident);

        const where: FindOptionsWhere<MedicalIncident> = {
            companyId: companyId
        };

        if (filters.studentId) where.studentId = filters.studentId;
        if (filters.incidentType) where.incidentType = filters.incidentType;
        if (filters.severity) where.severity = filters.severity;

        if (filters.dateStart && filters.dateEnd) {
            where.incidentDate = Between(
                new Date(filters.dateStart),
                new Date(filters.dateEnd + 'T23:59:59')
            );
        }

        const [incidents, total] = await incidentRepo.findAndCount({
            where,
            relations: ['student', 'reportedBy'],
            order: { incidentDate: 'DESC' },
            take: filters.limit || 50,
            skip: filters.offset || 0
        });

        // Map generic fields if necessary or return direct
        return {
            data: incidents,
            meta: {
                total,
                page: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
                lastPage: Math.ceil(total / (filters.limit || 50))
            }
        };
    },

    async createMedicalIncident(
        companyId: string,
        studentId: string,
        data: any,
        files: any, // { photos?: Express.Multer.File[], documents?: Express.Multer.File[] }
        userId: string
    ) {
        // 1. Validate Student
        const studentRepo = getScopedRepository(Student);
        const student = await studentRepo.findOne({
            where: { id: studentId, companyId }
        });

        if (!student) {
            throw new Error('Estudiante no encontrado');
        }

        // 2. Process Files
        const photoPaths = files?.photos?.map((f: any) => f.path) || [];
        const docPaths = files?.documents?.map((f: any) => f.path) || [];

        // 3. Create Incident
        const incidentRepo = AppDataSource.getRepository(MedicalIncident);

        const incident = incidentRepo.create({
            ...data,
            companyId,
            studentId,
            reportedById: userId,
            incidentDate: data.incidentDate ? new Date(data.incidentDate) : new Date(),
            requiredMedicalAttention: data.requiredMedicalAttention === 'true' || data.requiredMedicalAttention === true,
            followUpRequired: data.followUpRequired === 'true' || data.followUpRequired === true,
            photos: photoPaths,
            documents: docPaths
        }) as unknown as MedicalIncident | MedicalIncident[];

        // Handle potential array return from create
        const incidentToSave = Array.isArray(incident) ? incident[0] : incident;

        // Auto-Resolve if no follow-up required
        if (!incidentToSave.followUpRequired) {
            incidentToSave.resolvedAt = new Date();
        }

        const savedIncident = await incidentRepo.save(incidentToSave);

        // 4. Automatic Notification Logic (Point 7)
        try {
            // StudentGuardian doesn't have companyId, so use standard repository
            const studentGuardianRepo = AppDataSource.getRepository(StudentGuardian);
            const guardians = await studentGuardianRepo.find({
                where: { studentId: studentId, isActive: true },
                order: { priority: 'ASC' }, // Priority 1 is highest
                relations: ['guardian']
            });

            if (guardians.length > 0) {
                const mainGuardian = guardians[0];
                const guardian = mainGuardian.guardian;

                // Simulate Sending Notification
                console.log(`[SIMULATION] Notifying Guardian: ${guardian.firstName} ${guardian.lastName} (${guardian.email}) about Medical Incident via Email/SMS.`);
                console.log(`[SIMULATION] Message: Estimado apoderado, se ha registrado un incidente médico para el estudiante. Por favor revise el portal.`);

                // Update Incident
                // Force type assertion as MedicalIncident to avoid 'MedicalIncident[]' inference error
                const incidentToUpdate = (savedIncident as unknown) as MedicalIncident;

                incidentToUpdate.guardianNotified = true;
                incidentToUpdate.guardianNotifiedAt = new Date();
                incidentToUpdate.guardianId = mainGuardian.guardianId;
                incidentToUpdate.guardianNotifiedById = userId;

                await incidentRepo.save(incidentToUpdate);
            }
        } catch (error) {
            console.error('Error in automatic notification:', error);
            // Don't fail the request if notification fails, just log it.
        }

        return savedIncident;
    },

    async resolveIncident(
        companyId: string,
        incidentId: string,
        data: {
            followUpRequired?: boolean;
            followUpDate?: string;
            followUpNotes?: string;
            isClosed?: boolean;
        },
        userId: string
    ) {
        const incidentRepo = AppDataSource.getRepository(MedicalIncident);

        const incident = await incidentRepo.findOne({
            where: { id: incidentId, companyId }
        });

        if (!incident) {
            throw new Error('Incidente no encontrado');
        }

        // Update fields
        if (data.followUpRequired !== undefined) incident.followUpRequired = data.followUpRequired;
        if (data.followUpDate) incident.followUpDate = new Date(data.followUpDate);
        if (data.followUpNotes) incident.followUpNotes = data.followUpNotes;

        // Close/Resolve
        if (data.isClosed) {
            incident.resolvedAt = new Date();
        }

        return await incidentRepo.save(incident);
    }
};
