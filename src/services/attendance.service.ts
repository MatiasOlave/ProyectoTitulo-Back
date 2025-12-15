import { AppDataSource } from '../config/database';
import { Attendance } from '../entities/attendance/attendance.entity';
import { AttendanceAlert } from '../entities/attendance/attendance-alert.entity';
import { Student } from '../entities/students/student.entity';
import { validate as uuidValidate } from 'uuid';
import { LessThan, Between, EntityManager } from 'typeorm';

class AttendanceService {
    private attendanceRepository = AppDataSource.getRepository(Attendance);
    private alertRepository = AppDataSource.getRepository(AttendanceAlert);
    private studentRepository = AppDataSource.getRepository(Student);

    async bulkRegister(companyId: string, userId: string, data: any) {
        const { levelId, date, students } = data;
        const results: Attendance[] = [];

        // Transaction to ensure atomicity
        return await AppDataSource.transaction(async (transaction_manager) => {
            for (const item of students) {
                let attendance = await transaction_manager.findOne(Attendance, {
                    where: {
                        companyId: companyId,
                        studentId: item.studentId,
                        date: date
                    }
                });

                if (attendance) {
                    if (attendance.isLocked) {
                        continue;
                    }
                    // Update existing
                    transaction_manager.merge(Attendance, attendance, {
                        ...item,
                        lastModifiedById: userId
                    });
                } else {
                    // Create new
                    attendance = transaction_manager.create(Attendance, {
                        companyId: companyId,
                        recordedById: userId,
                        levelId: levelId,
                        date: date,
                        studentId: item.studentId,
                        status: item.status,
                        checkInTime: item.checkInTime,
                        checkOutTime: item.checkOutTime,
                        lateMinutes: item.lateMinutes,
                        absenceReason: item.absenceReason,
                        observations: item.observations,
                        justificationDocumentUrl: item.justificationDocumentUrl,
                        canEditUntil: new Date(new Date(date).getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days edit window
                    });
                }

                await transaction_manager.save(Attendance, attendance);
                results.push(attendance);

                // Notify Guardian on Single Absence (if new or status changed to absent)
                // Avoid spamming if updating same record without status change? 
                // For simplicity, we notify if status is 'absent' and it wasn't before? 
                // Actually bulkRegister is upsert. Let's send if status is 'absent' and (reason is empty or check requirements).
                // Requirement: "Por ausencia no justificada".
                // If status is absent and no absenceReason is provided?
                if (item.status === 'absent' && !item.absenceReason) {
                    // Check if we should notify (e.g. ensure we don't notify twice for the same day/student? - leaving simple for now)
                    // Ideally we check if we already notified today, but that requires a notification log.
                    // We'll call notifyGuardian directly.
                    await this.notifyGuardian(item.studentId, `Su pupilo ha faltado hoy ${date}. Por favor justificar.`);
                }

                // Check Alerts Logic Integration
                await this.checkAndCreateAlerts(transaction_manager, companyId, item.studentId, date);
            }
            return results;
        });
    }

    async updateAttendance(companyId: string, userId: string, id: string, data: any) {
        const attendance = await this.attendanceRepository.findOne({
            where: { id, companyId: companyId }
        });

        if (!attendance) throw new Error('Registro de asistencia no encontrado');
        if (attendance.isLocked) throw new Error('El registro está bloqueado y no se puede editar');
        if (new Date() > attendance.canEditUntil) throw new Error('El periodo de edición ha expirado');

        this.attendanceRepository.merge(attendance, {
            ...data,
            lastModifiedById: userId
        });

        const saved = await this.attendanceRepository.save(attendance);

        await this.checkAndCreateAlerts(AppDataSource.manager, companyId, attendance.studentId, attendance.date);

        return saved;
    }

    async lockAttendance(companyId: string, userId: string, levelId: string, date: Date) {
        const targetDate = new Date(date);

        const updateResult = await this.attendanceRepository
            .createQueryBuilder()
            .update(Attendance)
            .set({
                isLocked: true,
                lockedById: userId,
                lockedAt: new Date()
            })
            .where("company_id = :companyId", { companyId })
            .andWhere("level_id = :levelId", { levelId })
            .andWhere("date = :date", { date: targetDate })
            .execute();

        return { count: updateResult.affected };
    }

    async getAttendance(companyId: string, filters: any) {
        const qb = this.attendanceRepository.createQueryBuilder('attendance')
            .where('attendance.companyId = :companyId', { companyId });

        if (filters.studentId) {
            qb.andWhere('attendance.studentId = :studentId', { studentId: filters.studentId });
        }
        if (filters.levelId) {
            qb.andWhere('attendance.levelId = :levelId', { levelId: filters.levelId });
        }
        if (filters.startDate) {
            qb.andWhere('attendance.date >= :startDate', { startDate: filters.startDate });
        }
        if (filters.endDate) {
            qb.andWhere('attendance.date <= :endDate', { endDate: filters.endDate });
        }

        // Clone for stats BEFORE adding joins/pagination to avoid GROUP BY issues
        const statsQb = qb.clone();

        const [data, total] = await qb
            .leftJoinAndSelect('attendance.student', 'student')
            .skip((filters.page - 1) * filters.limit)
            .take(filters.limit)
            .orderBy('attendance.date', 'DESC')
            .getManyAndCount();

        const stats = await statsQb
            .select("attendance.status")
            .addSelect("COUNT(attendance.id)", "count")
            .groupBy("attendance.status")
            .getRawMany();

        const summary = {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total: total
        };

        stats.forEach((s: any) => {
            if (s.status === 'present') summary.present = parseInt(s.count);
            else if (s.status === 'absent') summary.absent = parseInt(s.count);
            else if (s.status === 'late') summary.late = parseInt(s.count);
            else if (s.status === 'excused') summary.excused = parseInt(s.count);
        });

        const presentOrLate = summary.present + summary.late;
        const totalRecorded = summary.present + summary.absent + summary.late + summary.excused;
        const percentage = totalRecorded > 0 ? (presentOrLate / totalRecorded) * 100 : 0;

        return {
            data,
            meta: {
                total,
                page: filters.page,
                limit: filters.limit,
                stats: { ...summary, percentage: parseFloat(percentage.toFixed(2)) }
            }
        };
    }

    private async checkAndCreateAlerts(manager: EntityManager, companyId: string, studentId: string, refDate: Date) {
        const CONSECUTIVE_LIMIT = 3;

        const recentRecords = await manager.find(Attendance, {
            where: { companyId: companyId, studentId: studentId },
            order: { date: 'DESC' },
            take: CONSECUTIVE_LIMIT + 1
        });

        let consecutive = 0;
        for (const r of recentRecords) {
            if (r.status === 'absent') consecutive++;
            else break;
        }

        if (consecutive >= CONSECUTIVE_LIMIT) {
            await this.createAlertIfNotExists(manager, companyId, studentId, 'consecutive_absences', refDate, {
                totalAbsences: consecutive,
                consecutiveAbsences: consecutive,
                dateRangeStart: recentRecords[consecutive - 1].date,
                severity: 'high'
            });
        }

        // Check Total Absences (e.g., limit 10)
        const totalAbsences = await manager.count(Attendance, {
            where: { companyId, studentId, status: 'absent' }
        });

        if (totalAbsences >= 10 && totalAbsences % 5 === 0) { // Alert at 10, 15, 20...
            await this.createAlertIfNotExists(manager, companyId, studentId, 'chronic_absenteeism', refDate, {
                totalAbsences: totalAbsences,
                severity: 'critical'
            });
        }

        // Check Chronic Lateness (e.g., limit 5)
        const totalLates = await manager.count(Attendance, {
            where: { companyId, studentId, status: 'late' }
        });

        if (totalLates >= 5 && totalLates % 5 === 0) {
            await this.createAlertIfNotExists(manager, companyId, studentId, 'chronic_lateness', refDate, {
                totalAbsences: totalLates, // Reusing field or adding metadata
                severity: 'medium'
            });
        }
    }

    private async createAlertIfNotExists(manager: EntityManager, companyId: string, studentId: string, type: string, refDate: Date, data: any) {
        const existing = await manager.findOne(AttendanceAlert, {
            where: {
                companyId: companyId,
                studentId: studentId,
                alertType: type,
                status: 'active'
            }
        });

        if (!existing) {
            const alert = manager.create(AttendanceAlert, {
                companyId: companyId,
                studentId: studentId,
                alertType: type,
                totalAbsences: data.totalAbsences || 0,
                consecutiveAbsences: data.consecutiveAbsences || 0,
                dateRangeStart: data.dateRangeStart || refDate,
                dateRangeEnd: refDate,
                severity: data.severity || 'medium',
                status: 'active'
            });
            await manager.save(AttendanceAlert, alert);
            this.notifyGuardian(studentId, `Alerta de Asistencia: ${type}`);
        }
    }

    private async notifyGuardian(studentId: string, message: string) {
        // Fetch guardian email via relation
        const student = await this.studentRepository.findOne({
            where: { id: studentId },
            relations: ['studentGuardians', 'studentGuardians.guardian']
        });

        // Find primary or first active guardian with email
        const guardianRelation = student?.studentGuardians?.find(sg => sg.isActive && sg.guardian?.email);
        const guardianEmail = guardianRelation?.guardian?.email;

        if (guardianEmail) {
            await import('./email.service').then(m => m.emailService.sendAttendanceAlert(guardianEmail, `${student!.firstName} ${student!.lastName}`, message));
        } else {
            console.log(`[EmailService] No guardian email found for student ${studentId} to send: ${message}`);
        }
    }

    async getAlerts(companyId: string) {
        return await this.alertRepository.find({
            where: { companyId: companyId, status: 'active' },
            relations: ['student'],
            order: { createdAt: 'DESC' }
        });
    }

    async resolveAlert(companyId: string, userId: string, alertId: string, data: any) {
        const alert = await this.alertRepository.findOne({ where: { id: alertId, companyId: companyId } });
        if (!alert) throw new Error('Alerta no encontrada');

        this.alertRepository.merge(alert, {
            status: 'resolved',
            resolvedById: userId,
            resolvedAt: new Date(),
            actionTaken: data.actionTaken,
            notes: data.notes
        });
        return await this.alertRepository.save(alert);
    }

    async exportAttendanceReport(companyId: string, filters: any) {
        const result = await this.getAttendance(companyId, { ...filters, limit: 10000 });
        return result.data;
    }

    async sendManualNotification(companyId: string, alertId: string, message: string) {
        const alert = await this.alertRepository.findOne({ where: { id: alertId, companyId } });
        if (!alert) throw new Error('Alerta no encontrada');

        await this.notifyGuardian(alert.studentId, message);
        return { success: true };
    }
}

export const attendanceService = new AttendanceService();
