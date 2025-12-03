import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { Company } from '../companies/company.entity';
import { Student } from '../students/student.entity';
import { User } from '../auth/user.entity';
import { Guardian } from '../students/guardian.entity';

@Entity('medical_incidents')
export class MedicalIncident extends BaseEntity {
    @ManyToOne(() => Company, company => company.medicalIncidents)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ name: 'company_id' })
    companyId: string;

    @ManyToOne(() => Student, student => student.medicalIncidents)
    @JoinColumn({ name: 'student_id' })
    student: Student;

    @Column({ name: 'student_id' })
    studentId: string;

    @Column({ name: 'incident_type', type: 'varchar', length: 100 })
    incidentType: string;

    @Column({ type: 'varchar', length: 50 })
    severity: string;

    @Column({ name: 'incident_date', type: 'timestamp' })
    incidentDate: Date;

    @Column({ type: 'varchar', length: 255 })
    location: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'text', nullable: true })
    symptoms: string;

    @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
    temperature: number;

    @Column({ name: 'actions_taken', type: 'text' })
    actionsTaken: string;

    @Column({ name: 'medication_given', type: 'varchar', length: 255, nullable: true })
    medicationGiven: string;

    @Column({ name: 'medication_dosage', type: 'varchar', length: 100, nullable: true })
    medicationDosage: string;

    @Column({ name: 'medication_time', type: 'timestamp', nullable: true })
    medicationTime: Date;

    @Column({ name: 'guardian_notified', type: 'boolean', default: false })
    guardianNotified: boolean;

    @Column({ name: 'guardian_notified_at', type: 'timestamp', nullable: true })
    guardianNotifiedAt: Date;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'guardian_notified_by' })
    guardianNotifiedBy: User;

    @Column({ name: 'guardian_notified_by', nullable: true })
    guardianNotifiedById: string;

    @ManyToOne(() => Guardian, { nullable: true })
    @JoinColumn({ name: 'guardian_id' })
    guardian: Guardian;

    @Column({ name: 'guardian_id', nullable: true })
    guardianId: string;

    @Column({ name: 'required_medical_attention', type: 'boolean', default: false })
    requiredMedicalAttention: boolean;

    @Column({ name: 'medical_center_visited', type: 'varchar', length: 255, nullable: true })
    medicalCenterVisited: string;

    @Column({ name: 'doctor_seen', type: 'varchar', length: 255, nullable: true })
    doctorSeen: string;

    @Column({ type: 'text', nullable: true })
    diagnosis: string;

    @Column({ name: 'treatment_received', type: 'text', nullable: true })
    treatmentReceived: string;

    @Column({ name: 'follow_up_required', type: 'boolean', default: false })
    followUpRequired: boolean;

    @Column({ name: 'follow_up_notes', type: 'text', nullable: true })
    followUpNotes: string;

    @Column({ name: 'follow_up_date', type: 'date', nullable: true })
    followUpDate: Date;

    @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
    resolvedAt: Date;

    @ManyToOne(() => User, user => user.reportedMedicalIncidents)
    @JoinColumn({ name: 'reported_by' })
    reportedBy: User;

    @Column({ name: 'reported_by' })
    reportedById: string;

    @Column({ name: 'witnessed_by', type: 'text', nullable: true })
    witnessedBy: string;

    @Column({ type: 'json', nullable: true })
    photos: any;

    @Column({ type: 'json', nullable: true })
    documents: any;
}