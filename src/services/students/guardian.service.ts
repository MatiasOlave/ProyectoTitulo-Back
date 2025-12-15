import { Brackets } from 'typeorm';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getScopedRepository } from '../../utils/scoped-repository';
import { AppDataSource } from '../../config/database';
import { Guardian } from '../../entities/students/guardian.entity';
import { StudentGuardian } from '../../entities/students/student-guardian.entity';
import { Student } from '../../entities/students/student.entity';
import { User } from '../../entities/auth/user.entity';
import { Role } from '../../entities/auth/role.entity';
import { UserRole } from '../../entities/auth/user-role.entity';
import { emailService } from '../email.service';

export const guardianService = {
    /**
     * Create a new guardian
     */
    async createGuardian(data: {
        firstName: string;
        lastName: string;
        rut?: string;
        email: string;
        phone: string;
        phoneSecondary?: string;
        relationship: string;
        address: string;
        cityId?: string;
        occupation?: string;
        workplace?: string;
        workPhone?: string;
        preferredContactMethod?: string;
        contactTimePreference?: string;
        isPrimary?: boolean;
        isAuthorizedPickup?: boolean;
        isEmergencyContact?: boolean;
        isAuthorizedMedicalDecisions?: boolean;
        photoConsent?: boolean;
    }, companyId: string) {
        const guardianRepo = getScopedRepository(Guardian);

        // Validate unique email within company
        const existingEmail = await guardianRepo.findOne({
            where: { email: data.email }
        });

        if (existingEmail) {
            throw new Error('El correo electrónico ya está registrado');
        }

        // Validate RUT if provided
        if (data.rut) {
            const existingRut = await guardianRepo.findOne({
                where: { rut: data.rut }
            });

            if (existingRut) {
                throw new Error('El RUT ya está registrado');
            }
        }

        const guardian = guardianRepo.create({
            ...data,
            companyId
        });

        // Check for existing user to link automatically
        const userRepo = getScopedRepository(User);
        const roleRepo = AppDataSource.getRepository(Role); // Role is global usually, or scoped? using global for lookup first
        const userRoleRepo = getScopedRepository(UserRole);

        let existingUser = await userRepo['repository'].findOne({
            where: [{ email: data.email }, { rut: data.rut }]
        });

        if (existingUser) {
            guardian.userId = existingUser.id;

            // Ensure user has GUARDIAN role
            const guardianRole = await roleRepo.findOne({ where: { code: 'GUARDIAN' } });
            if (guardianRole) {
                const hasRole = await userRoleRepo.findOne({
                    where: { userId: existingUser.id, roleId: guardianRole.id, companyId }
                });

                if (!hasRole) {
                    const newUserRole = new UserRole();
                    newUserRole.user = existingUser;
                    newUserRole.role = guardianRole;
                    newUserRole.userId = existingUser.id;
                    newUserRole.roleId = guardianRole.id;
                    newUserRole.companyId = companyId;
                    newUserRole.assignedAt = new Date();
                    await userRoleRepo.save(newUserRole);
                }
            }
        }

        return await guardianRepo.save(guardian);
    },

    /**
     * List guardians with filters and pagination
     */
    async listGuardians(companyId: string, filters: {
        search?: string;
        isPrimary?: boolean;
        page?: number;
        limit?: number;
    }) {
        const { search, isPrimary, page = 1, limit = 10 } = filters;
        const guardianRepo = getScopedRepository(Guardian);

        const queryBuilder = guardianRepo['repository']
            .createQueryBuilder('guardian')
            .leftJoinAndSelect('guardian.city', 'city')
            .where('guardian.companyId = :companyId', { companyId })
            .andWhere('guardian.deletedAt IS NULL');

        // Apply search filter
        if (search) {
            queryBuilder.andWhere(new Brackets(qb => {
                qb.where('guardian.firstName LIKE :search', { search: `%${search}%` })
                    .orWhere('guardian.lastName LIKE :search', { search: `%${search}%` })
                    .orWhere('guardian.email LIKE :search', { search: `%${search}%` })
                    .orWhere('guardian.rut LIKE :search', { search: `%${search}%` })
                    .orWhere('guardian.phone LIKE :search', { search: `%${search}%` });
            }));
        }

        // Filter by primary guardian
        if (isPrimary !== undefined) {
            queryBuilder.andWhere('guardian.isPrimary = :isPrimary', { isPrimary });
        }

        // Apply pagination
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);

        // Order by creation date
        queryBuilder.orderBy('guardian.createdAt', 'DESC');

        const [guardians, total] = await queryBuilder.getManyAndCount();

        return {
            guardians: guardians.map((g: any) => ({
                id: g.id,
                firstName: g.firstName,
                lastName: g.lastName,
                rut: g.rut,
                email: g.email,
                phone: g.phone,
                phoneSecondary: g.phoneSecondary,
                relationship: g.relationship,
                address: g.address,
                city: g.city,
                occupation: g.occupation,
                workplace: g.workplace,
                workPhone: g.workPhone,
                preferredContactMethod: g.preferredContactMethod,
                contactTimePreference: g.contactTimePreference,
                isPrimary: g.isPrimary,
                isAuthorizedPickup: g.isAuthorizedPickup,
                isEmergencyContact: g.isEmergencyContact,
                isAuthorizedMedicalDecisions: g.isAuthorizedMedicalDecisions,
                photoConsent: g.photoConsent,
                dataConsentGiven: g.dataConsentGiven,
                dataConsentDate: g.dataConsentDate,
                createdAt: g.createdAt,
                hasUser: !!g.userId
            })),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    },

    /**
     * Get guardian by ID with full profile
     */
    async getGuardianById(guardianId: string, companyId: string) {
        const guardianRepo = getScopedRepository(Guardian);

        const guardian = await guardianRepo['repository']
            .createQueryBuilder('guardian')
            .leftJoinAndSelect('guardian.city', 'city')
            .leftJoinAndSelect('city.region', 'region')
            .leftJoinAndSelect('region.country', 'country')
            .leftJoinAndSelect('guardian.user', 'user')
            .leftJoinAndSelect('guardian.studentGuardians', 'studentGuardians')
            .leftJoinAndSelect('studentGuardians.student', 'student')
            .where('guardian.id = :guardianId', { guardianId })
            .andWhere('guardian.companyId = :companyId', { companyId })
            .andWhere('guardian.deletedAt IS NULL')
            .getOne();

        if (!guardian) {
            throw new Error('Apoderado no encontrado');
        }

        return {
            ...guardian,
            hasUser: !!guardian.userId || !!guardian.user
        };
    },

    /**
     * Update guardian
     */
    async updateGuardian(guardianId: string, companyId: string, data: Partial<Guardian>) {
        const guardianRepo = getScopedRepository(Guardian);

        const guardian = await guardianRepo.findOne({
            where: { id: guardianId }
        });

        if (!guardian) {
            throw new Error('Apoderado no encontrado');
        }

        // Check if email is being changed and validated uniqueness
        if (data.email && data.email !== guardian.email) {
            const existingEmail = await guardianRepo.findOne({
                where: { email: data.email }
            });

            if (existingEmail) {
                throw new Error('El correo electrónico ya está en uso');
            }
        }

        // Check if RUT is being changed and validate uniqueness
        if (data.rut && data.rut !== guardian.rut) {
            const existingRut = await guardianRepo.findOne({
                where: { rut: data.rut }
            });

            if (existingRut) {
                throw new Error('El RUT ya está en uso');
            }
        }

        Object.assign(guardian, data);
        return await guardianRepo.save(guardian);
    },

    /**
     * Soft delete guardian
     */
    async deleteGuardian(guardianId: string, companyId: string, deletedById: string) {
        const guardianRepo = getScopedRepository(Guardian);

        const guardian = await guardianRepo.findOne({
            where: { id: guardianId }
        });

        if (!guardian) {
            throw new Error('Apoderado no encontrado');
        }

        // Set deletedBy before soft delete
        guardian.deletedById = deletedById;
        await guardianRepo.save(guardian);

        // Perform soft delete
        await guardianRepo.softDelete({ id: guardianId });

        return {
            success: true,
            message: 'Apoderado eliminado correctamente'
        };
    },

    // ==========================================
    // STUDENT LINKAGE MANAGEMENT
    // ==========================================

    /**
     * Link a student to a guardian with specific permissions
     */
    async linkStudentToGuardian(
        guardianId: string,
        studentId: string,
        linkData: {
            relationshipType: string;
            priority?: number;
            canPickup?: boolean;
            canReceiveCommunications?: boolean;
            canAuthorizeMedical?: boolean;
            canSeeAcademicInfo?: boolean;
            hasLegalCustody?: boolean;
            custodyType?: string;
            custodyNotes?: string;
            livesWithStudent?: boolean;
        },
        companyId: string,
        createdById: string
    ) {
        const guardianRepo = getScopedRepository(Guardian);
        const studentRepo = getScopedRepository(Student);
        const linkRepo = getScopedRepository(StudentGuardian);

        if (!companyId) {
            throw new Error('ID de empresa no proporcionado');
        }

        // Verify guardian belongs to company
        const guardian = await guardianRepo.findOne({
            where: { id: guardianId }
        });

        if (!guardian) {
            throw new Error('Apoderado no encontrado');
        }

        // Verify student belongs to company
        const student = await studentRepo.findOne({
            where: { id: studentId }
        });

        if (!student) {
            throw new Error('Estudiante no encontrado');
        }

        // Check if link already exists
        // Check if link already exists (including soft deleted)
        const existingLink = await linkRepo['repository']
            .createQueryBuilder('sg')
            .withDeleted()
            .leftJoin('sg.guardian', 'guardian')
            .where('sg.guardianId = :guardianId', { guardianId })
            .andWhere('sg.studentId = :studentId', { studentId })
            .andWhere('guardian.companyId = :companyId', { companyId })
            .getOne();

        if (existingLink) {
            if (!existingLink.deletedAt) {
                throw new Error('Este estudiante ya está vinculado con este apoderado');
            }

            // Restore soft deleted link
            existingLink.deletedAt = null;
            Object.assign(existingLink, {
                ...linkData,
                isActive: true, // Reactivate
                createdById // Update creator? optional
            });

            console.log('Restoring previous StudentGuardian link:', existingLink.id);
            return await linkRepo.save(existingLink);
        }

        const link = linkRepo.create({
            guardianId,
            studentId,
            ...linkData,
            companyId, // Explicitly assign companyId
            createdById,
            isActive: true
        });

        console.log('Attempting to save StudentGuardian link:', {
            guardianId,
            studentId,
            companyId,
            ...linkData,
            createdById
        });

        try {
            const savedLink = await linkRepo.save(link);
            console.log('Link saved successfully:', savedLink.id);
            return savedLink;
        } catch (error) {
            console.error('Error saving StudentGuardian link:', error);
            throw error;
        }
    },

    /**
     * Update student-guardian link permissions
     */
    async updateStudentGuardianLink(
        linkId: string,
        linkData: Partial<StudentGuardian>,
        companyId: string
    ) {
        const linkRepo = getScopedRepository(StudentGuardian);

        const link = await linkRepo['repository']
            .createQueryBuilder('sg')
            .leftJoinAndSelect('sg.guardian', 'guardian')
            .where('sg.id = :linkId', { linkId })
            .andWhere('guardian.companyId = :companyId', { companyId })
            .andWhere('sg.deletedAt IS NULL')
            .getOne();

        if (!link) {
            throw new Error('Vinculación no encontrada');
        }

        Object.assign(link, linkData);
        return await linkRepo.save(link);
    },

    /**
     * Remove student-guardian link (soft delete)
     */
    async unlinkStudentFromGuardian(linkId: string, companyId: string) {
        const linkRepo = getScopedRepository(StudentGuardian);

        const link = await linkRepo['repository']
            .createQueryBuilder('sg')
            .leftJoin('sg.guardian', 'guardian')
            .where('sg.id = :linkId', { linkId })
            .andWhere('guardian.companyId = :companyId', { companyId })
            .getOne();

        if (!link) {
            throw new Error('Vinculación no encontrada');
        }

        await linkRepo.softDelete({ id: linkId });

        return {
            success: true,
            message: 'Vinculación eliminada correctamente'
        };
    },

    /**
     * Get all students linked to a guardian
     */
    async getGuardianStudents(guardianId: string, companyId: string) {
        const linkRepo = getScopedRepository(StudentGuardian);

        const links = await linkRepo['repository']
            .createQueryBuilder('sg')
            .leftJoinAndSelect('sg.student', 'student')
            .leftJoinAndSelect('sg.guardian', 'guardian')
            .where('sg.guardianId = :guardianId', { guardianId })
            .andWhere('guardian.companyId = :companyId', { companyId })
            .andWhere('sg.deletedAt IS NULL')
            .orderBy('sg.priority', 'ASC')
            .getMany();

        return links;
    },

    // ==========================================
    // INVITATION & USER ACCOUNT CREATION
    // ==========================================

    /**
     * Send invitation to guardian
     */
    async inviteGuardian(guardianId: string, companyId: string) {
        const guardianRepo = getScopedRepository(Guardian);

        const guardian = await guardianRepo['repository']
            .createQueryBuilder('guardian')
            .leftJoinAndSelect('guardian.studentGuardians', 'sg')
            .leftJoinAndSelect('sg.student', 'student')
            .where('guardian.id = :guardianId', { guardianId })
            .andWhere('guardian.companyId = :companyId', { companyId })
            .getOne();

        if (!guardian) {
            throw new Error('Apoderado no encontrado');
        }

        if (guardian.userId) {
            throw new Error('Este apoderado ya tiene una cuenta de usuario');
        }

        // Generate unique token
        const token = crypto.randomBytes(32).toString('hex');

        // Set expiration (48 hours from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48);

        guardian.invitationToken = token;
        guardian.invitationExpiresAt = expiresAt;
        guardian.invitationSentAt = new Date();

        await guardianRepo.save(guardian);

        // Get student name for email
        const studentName = guardian.studentGuardians?.[0]?.student
            ? `${guardian.studentGuardians[0].student.firstName} ${guardian.studentGuardians[0].student.lastName}`
            : 'su estudiante';

        // Send invitation email
        await emailService.sendGuardianInvitation(guardian.email, token, studentName);

        return {
            success: true,
            message: 'Invitación enviada correctamente',
            expiresAt
        };
    },

    /**
     * Validate invitation token
     */
    async validateInvitationToken(token: string) {
        // Use raw repository for token validation (public access, no company context)
        const guardianRepo = AppDataSource.getRepository(Guardian);

        const guardian = await guardianRepo
            .createQueryBuilder('guardian')
            .leftJoinAndSelect('guardian.company', 'company')
            .where('guardian.invitationToken = :token', { token })
            .andWhere('guardian.deletedAt IS NULL')
            .getOne();

        if (!guardian) {
            throw new Error('Token de invitación inválido');
        }

        if (guardian.userId) {
            throw new Error('Esta invitación ya ha sido utilizada');
        }

        if (guardian.invitationExpiresAt && guardian.invitationExpiresAt < new Date()) {
            throw new Error('La invitación ha expirado');
        }

        return {
            valid: true,
            guardian: {
                id: guardian.id,
                firstName: guardian.firstName,
                lastName: guardian.lastName,
                email: guardian.email,
                rut: guardian.rut,
                phone: guardian.phone,
                companyName: guardian.company?.name
            }
        };
    },

    /**
     * Accept invitation and create user account
     */
    async acceptInvitation(token: string, password: string) {
        // Use raw repositories for public endpoint (no company context yet)
        const guardianRepo = AppDataSource.getRepository(Guardian);
        const userRepo = AppDataSource.getRepository(User);
        const roleRepo = AppDataSource.getRepository(Role);
        const userRoleRepo = AppDataSource.getRepository(UserRole);

        // Validate token first
        const guardian = await guardianRepo.findOne({
            where: { invitationToken: token },
            relations: ['company']
        });

        if (!guardian) {
            throw new Error('Token de invitación inválido');
        }

        if (guardian.userId) {
            throw new Error('Esta invitación ya ha sido utilizada');
        }

        if (guardian.invitationExpiresAt && guardian.invitationExpiresAt < new Date()) {
            throw new Error('La invitación ha expirado');
        }

        // Check if user with this email already exists
        const existingUser = await userRepo.findOne({
            where: { email: guardian.email }
        });

        if (existingUser) {
            // Link existing user to guardian
            guardian.userId = existingUser.id;
            guardian.invitationAcceptedAt = new Date();
            guardian.invitationToken = null;
            await guardianRepo.save(guardian);

            return {
                success: true,
                message: 'Cuenta vinculada exitosamente'
            };
        }

        // Find GUARDIAN role
        const guardianRole = await roleRepo.findOne({
            where: { code: 'GUARDIAN' }
        });

        if (!guardianRole) {
            throw new Error('Error de configuración: Rol GUARDIAN no encontrado');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = userRepo.create({
            email: guardian.email,
            passwordHash,
            firstName: guardian.firstName,
            lastName: guardian.lastName,
            rut: guardian.rut,
            phone: guardian.phone,
            isActive: true,
            emailVerified: true, // Verified through invitation
            companyId: guardian.companyId
        });

        await userRepo.save(newUser);

        // Assign GUARDIAN role
        const userRole = userRoleRepo.create({
            userId: newUser.id,
            roleId: guardianRole.id,
            companyId: guardian.companyId,
            assignedAt: new Date()
        });

        await userRoleRepo.save(userRole);

        // Update guardian with user reference
        guardian.userId = newUser.id;
        guardian.invitationAcceptedAt = new Date();
        guardian.invitationToken = null;

        await guardianRepo.save(guardian);

        return {
            success: true,
            message: 'Cuenta creada y vinculada exitosamente',
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName
            }
        };
    },

    // ==========================================
    // CONSENT MANAGEMENT
    // ==========================================

    /**
     * Update guardian consents
     */
    async updateConsents(
        guardianId: string,
        companyId: string,
        consents: {
            dataConsentGiven?: boolean;
            photoConsent?: boolean;
        }
    ) {
        const guardianRepo = getScopedRepository(Guardian);

        const guardian = await guardianRepo.findOne({
            where: { id: guardianId }
        });

        if (!guardian) {
            throw new Error('Apoderado no encontrado');
        }

        if (consents.dataConsentGiven !== undefined) {
            guardian.dataConsentGiven = consents.dataConsentGiven;
            if (consents.dataConsentGiven) {
                guardian.dataConsentDate = new Date();
            }
        }

        if (consents.photoConsent !== undefined) {
            guardian.photoConsent = consents.photoConsent;
        }

        return await guardianRepo.save(guardian);
    },

    // ==========================================
    // PERMISSION MANAGEMENT
    // ==========================================

    /**
     * Update specific permissions for a guardian
     */
    async updatePermissions(
        guardianId: string,
        companyId: string,
        permissions: {
            isAuthorizedPickup?: boolean;
            isAuthorizedMedicalDecisions?: boolean;
            isEmergencyContact?: boolean;
        }
    ) {
        const guardianRepo = getScopedRepository(Guardian);

        const guardian = await guardianRepo.findOne({
            where: { id: guardianId }
        });

        if (!guardian) {
            throw new Error('Apoderado no encontrado');
        }

        Object.assign(guardian, permissions);
        return await guardianRepo.save(guardian);
    }
};
