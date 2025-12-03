import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { UserRole } from "./user-role.entity";
import { BaseEntity } from "../base.entity";
import { Company } from "../companies/company.entity";
import { MedicalIncident } from "../medical/medical-incident.entity";
import { Attendance } from "../attendance/attendance.entity";
import { AttendanceAlert } from "../attendance/attendance-alert.entity";
import { ActivityPlanning } from "../academic/activity-planning.entity";
import { ClassBookEntry } from "../academic/class-book-entry.entity";
import { PlanningReview } from "../academic/planning-review.entity";
import { Driver } from "../transport/driver.entity";

@Entity('users')
export class User extends BaseEntity {

    @ManyToOne(() => Company, company => company.users)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ name: 'company_id' })
    companyId: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ name:'password_hash', type: 'varchar', length: 255 })
    passwordHash: string;

    @Column({ name: 'first_name', type: 'varchar', length: 255 })
    firstName: string;

    @Column({ name: 'last_name', type: 'varchar', length: 255 })
    lastName: string;

    @Column({ type: 'varchar', length: 50 })
    rut: string;

    @Column({ type: 'varchar', length: 50 })
    phone: string;

    @Column({ name: 'avatar_url', type: 'text', nullable: true })
    avatarUrl: string;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ name: 'email_verified', type: 'boolean', default: false })
    emailVerified: boolean;

    @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
    lastLoginAt: Date;

    @Column({ name:'password_reset_token', type: 'varchar', length: 255, nullable: true })
    passwordResetToken: string | null;

    @Column({ name:'password_reset_expires', type: 'timestamp', nullable: true })
    passwordResetExpires: Date | null;

    @OneToMany(() => UserRole, userRole => userRole.user)
    userRoles: UserRole[];

    @OneToMany(() => UserRole, userRole => userRole.assignedBy)
    assignedRoles: UserRole[];
    
    @OneToMany(() => MedicalIncident, medicalIncident => medicalIncident.reportedBy)
    reportedMedicalIncidents: MedicalIncident[];

    @OneToMany(() => MedicalIncident, medicalIncident => medicalIncident.guardianNotifiedBy)
    notifiedMedicalIncidents: MedicalIncident[];

    @OneToMany(() => Attendance, attendance => attendance.recordedBy)
    recordedAttendances: Attendance[];

    @OneToMany(() => Attendance, attendance => attendance.lastModifiedBy)
    modifiedAttendances: Attendance[];

    @OneToMany(() => Attendance, attendance => attendance.lockedBy)
    lockedAttendances: Attendance[];

    @OneToMany(() => AttendanceAlert, attendanceAlert => attendanceAlert.guardianContactedBy)
    contactedAttendanceAlerts: AttendanceAlert[];

    @OneToMany(() => AttendanceAlert, attendanceAlert => attendanceAlert.resolvedBy)
    resolvedAttendanceAlerts: AttendanceAlert[];

    @OneToMany(() => ActivityPlanning, planning => planning.teacher)
    activityPlannings: ActivityPlanning[];

    @OneToMany(() => ClassBookEntry, entry => entry.teacher)
    classBookEntries: ClassBookEntry[];

    @OneToMany(() => PlanningReview, review => review.reviewer)
    planningReviews: PlanningReview[];

    @OneToMany(() => Driver, driver => driver.user)
    drivers: Driver[]
}