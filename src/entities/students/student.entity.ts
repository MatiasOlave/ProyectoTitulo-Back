import { Entity, Column, ManyToOne, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { Level } from './level.entity';
import { StudentGuardian } from './student-guardian.entity';
import { EmergencyContact } from './emergency-contact.entity';
import { MedicalInfo } from './medical-info.entity';
import { BaseEntity } from '../base.entity';
import { Company } from '../companies/company.entity';
import { City } from '../shared/city.entity';
import { User } from '../auth/user.entity';
import { MedicalIncident } from '../medical/medical-incident.entity';
import { Attendance } from '../attendance/attendance.entity';
import { AttendanceAlert } from '../attendance/attendance-alert.entity';
import { StudentObservation } from '../academic/student-observation.entity';
import { RouteStop } from '../transport/route-stop.entity';
import { TripStop } from '../transport/trip-stop.entity';
import { StudentBillingSnapshot } from '../companies/student-billing.entity';


@Entity('students')
export class Student extends BaseEntity {
    @ManyToOne(() => Company, company => company.students)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ name: 'company_id' })
    companyId: string;

    @Column({ name: 'first_name', type: 'varchar', length: 255 })
    firstName: string;

    @Column({ name: 'last_name', type: 'varchar', length: 255 })
    lastName: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    rut: string;

    @Column({ name: 'birth_date', type: 'date' })
    birthDate: Date;

    @Column({ type: 'varchar', length: 50 })
    gender: string;

    @Column({ name: 'photo_url', type: 'text', nullable: true })
    photoUrl: string;

    @Column({ type: 'text' })
    address: string;

    @Column({ name: 'enrollment_date', type: 'date' })
    enrollmentDate: Date;

    @Column({ type: 'varchar', length: 50, default: 'active' })
    status: string;

    @ManyToOne(() => City, { nullable: true })
    @JoinColumn({ name: 'city_id' })
    city: City;

    @Column({ name: 'city_id', nullable: true })
    cityId: string;

    @ManyToOne(() => Level, level => level.students, { nullable: true })
    @JoinColumn({ name: 'level_id' })
    level: Level;

    @Column({ name: 'level_id', nullable: true })
    levelId: string;

    @Column({ name: 'enrollment_number', type: 'varchar', length: 50, nullable: true })
    enrollmentNumber: string;

    @Column({ name: 'withdrawal_date', type: 'date', nullable: true })
    withdrawalDate: Date;

    @Column({ name: 'withdrawal_reason', type: 'text', nullable: true })
    withdrawalReason: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'deleted_by' })
    deletedBy: User;

    @Column({ name: 'deleted_by', nullable: true })
    deletedById: string;

    @OneToMany(() => StudentGuardian, studentGuardian => studentGuardian.student)
    studentGuardians: StudentGuardian[];

    @OneToMany(() => EmergencyContact, emergencyContact => emergencyContact.student)
    emergencyContacts: EmergencyContact[];

    @OneToOne(() => MedicalInfo, medicalInfo => medicalInfo.student)
    medicalInfo: MedicalInfo;

    @OneToMany(() => MedicalIncident, medicalIncident => medicalIncident.student)
    medicalIncidents: MedicalIncident[];

    @OneToMany(() => Attendance, attendance => attendance.student)
    attendances: Attendance[];

    @OneToMany(() => AttendanceAlert, attendanceAlert => attendanceAlert.student)
    attendanceAlerts: AttendanceAlert[];

    @OneToMany(() => StudentObservation, observation => observation.student)
    observations: StudentObservation[]

    @OneToMany(() => RouteStop, routeStop => routeStop.student)
    routeStops: RouteStop[]

    @OneToMany(() => TripStop, tripStop => tripStop.student)
    tripStops: TripStop[]

    @OneToMany(() => StudentBillingSnapshot, snapshot => snapshot.student)
    studentSnapshots: StudentBillingSnapshot[]
}