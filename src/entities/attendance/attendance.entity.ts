import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { Company } from '../companies/company.entity';
import { Student } from '../students/student.entity';
import { Level } from '../students/level.entity';
import { User } from '../auth/user.entity';

@Entity('attendance')
export class Attendance extends BaseEntity {
    @ManyToOne(() => Company, company => company.attendances)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ name: 'company_id' })
    companyId: string;

    @ManyToOne(() => Student, student => student.attendances)
    @JoinColumn({ name: 'student_id' })
    student: Student;

    @Column({ name: 'student_id' })
    studentId: string;

    @ManyToOne(() => Level, level => level.attendances)
    @JoinColumn({ name: 'level_id' })
    level: Level;

    @Column({ name: 'level_id' })
    levelId: string;

    @Column({ type: 'date' })
    date: Date;

    @Column({ type: 'varchar', length: 50 })
    status: string;

    @Column({ name: 'check_in_time', type: 'time', nullable: true })
    checkInTime: string;

    @Column({ name: 'check_out_time', type: 'time', nullable: true })
    checkOutTime: string;

    @Column({ name: 'late_minutes', type: 'int', nullable: true })
    lateMinutes: number;

    @Column({ name: 'absence_reason', type: 'varchar', length: 100, nullable: true })
    absenceReason: string;

    @Column({ type: 'text', nullable: true })
    observations: string;

    @Column({ name: 'justification_document_url', type: 'text', nullable: true })
    justificationDocumentUrl: string;

    @ManyToOne(() => User, user => user.recordedAttendances)
    @JoinColumn({ name: 'recorded_by' })
    recordedBy: User;

    @Column({ name: 'recorded_by' })
    recordedById: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'last_modified_by' })
    lastModifiedBy: User;

    @Column({ name: 'last_modified_by', nullable: true })
    lastModifiedById: string;

    @Column({ name: 'can_edit_until', type: 'timestamp' })
    canEditUntil: Date;

    @Column({ name: 'is_locked', type: 'boolean', default: false })
    isLocked: boolean;

    @Column({ name: 'locked_at', type: 'timestamp', nullable: true })
    lockedAt: Date;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'locked_by' })
    lockedBy: User;

    @Column({ name: 'locked_by', nullable: true })
    lockedById: string;

    @Column({ name: 'guardian_notified', type: 'boolean', default: false })
    guardianNotified: boolean;

    @Column({ name: 'guardian_notified_at', type: 'timestamp', nullable: true })
    guardianNotifiedAt: Date;
}