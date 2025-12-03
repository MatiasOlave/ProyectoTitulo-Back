import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { Company } from '../companies/company.entity';
import { Student } from '../students/student.entity';
import { User } from '../auth/user.entity';


@Entity('attendance_alerts')
export class AttendanceAlert extends BaseEntity {
    @ManyToOne(() => Company, company => company.attendanceAlerts)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ name: 'company_id' })
    companyId: string;

    @ManyToOne(() => Student, student => student.attendanceAlerts)
    @JoinColumn({ name: 'student_id' })
    student: Student;

    @Column({ name: 'student_id' })
    studentId: string;

    @Column({ name: 'alert_type', type: 'varchar', length: 50 })
    alertType: string;

    @Column({ name: 'total_absences', type: 'int' })
    totalAbsences: number;

    @Column({ name: 'consecutive_absences', type: 'int', nullable: true })
    consecutiveAbsences: number;

    @Column({ name: 'total_lates', type: 'int', nullable: true })
    totalLates: number;

    @Column({ name: 'date_range_start', type: 'date' })
    dateRangeStart: Date;

    @Column({ name: 'date_range_end', type: 'date' })
    dateRangeEnd: Date;

    @Column({ type: 'varchar', length: 50 })
    severity: string;

    @Column({ type: 'varchar', length: 50, default: 'active' })
    status: string;

    @Column({ name: 'guardian_contacted', type: 'boolean', default: false })
    guardianContacted: boolean;

    @Column({ name: 'guardian_contacted_at', type: 'timestamp', nullable: true })
    guardianContactedAt: Date;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'guardian_contacted_by' })
    guardianContactedBy: User;

    @Column({ name: 'guardian_contacted_by', nullable: true })
    guardianContactedById: string;

    @Column({ name: 'action_taken', type: 'text', nullable: true })
    actionTaken: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
    resolvedAt: Date;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'resolved_by' })
    resolvedBy: User;

    @Column({ name: 'resolved_by', nullable: true })
    resolvedById: string;
}