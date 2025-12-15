import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { StudentGuardian } from './student-guardian.entity';
import { MedicalInfo } from './medical-info.entity';
import { BaseEntity } from '../base.entity';
import { Company } from '../companies/company.entity';
import { User } from '../auth/user.entity';
import { City } from '../shared/city.entity';
import { MedicalIncident } from '../medical/medical-incident.entity';

@Entity('guardians')
export class Guardian extends BaseEntity {
    @ManyToOne(() => Company, company => company.guardians)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ name: 'company_id' })
    companyId: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id', nullable: true })
    userId: string;

    @Column({ name: 'first_name', type: 'varchar', length: 255 })
    firstName: string;

    @Column({ name: 'last_name', type: 'varchar', length: 255 })
    lastName: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    rut: string;

    @Column({ type: 'varchar', length: 255 })
    email: string;

    @Column({ type: 'varchar', length: 50 })
    phone: string;

    @Column({ name: 'phone_secondary', type: 'varchar', length: 50, nullable: true })
    phoneSecondary: string;

    @Column({ type: 'varchar', length: 100 })
    relationship: string;

    @Column({ type: 'text' })
    address: string;

    @ManyToOne(() => City, { nullable: true })
    @JoinColumn({ name: 'city_id' })
    city: City;

    @Column({ name: 'city_id', nullable: true })
    cityId: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    occupation: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    workplace: string;

    @Column({ name: 'work_phone', type: 'varchar', length: 50, nullable: true })
    workPhone: string;

    @Column({ name: 'preferred_contact_method', type: 'varchar', length: 50, default: 'email' })
    preferredContactMethod: string;

    @Column({ name: 'contact_time_preference', type: 'varchar', length: 100, nullable: true })
    contactTimePreference: string;

    @Column({ name: 'is_primary', type: 'boolean', default: false })
    isPrimary: boolean;

    @Column({ name: 'is_authorized_pickup', type: 'boolean', default: true })
    isAuthorizedPickup: boolean;

    @Column({ name: 'is_emergency_contact', type: 'boolean', default: true })
    isEmergencyContact: boolean;

    @Column({ name: 'is_authorized_medical_decisions', type: 'boolean', default: false })
    isAuthorizedMedicalDecisions: boolean;

    @Column({ name: 'invitation_token', type: 'varchar', length: 255, nullable: true })
    invitationToken: string | null;

    @Column({ name: 'invitation_sent_at', type: 'timestamp', nullable: true })
    invitationSentAt: Date;

    @Column({ name: 'invitation_accepted_at', type: 'timestamp', nullable: true })
    invitationAcceptedAt: Date;

    @Column({ name: 'invitation_expires_at', type: 'timestamp', nullable: true })
    invitationExpiresAt: Date;

    @Column({ name: 'data_consent_given', type: 'boolean', default: false })
    dataConsentGiven: boolean;

    @Column({ name: 'data_consent_date', type: 'timestamp', nullable: true })
    dataConsentDate: Date;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'deleted_by' })
    deletedBy: User;

    @Column({ name: 'deleted_by', nullable: true })
    deletedById: string;

    @Column({ name: 'photo_consent', type: 'boolean', default: false })
    photoConsent: boolean;

    @OneToMany(() => StudentGuardian, studentGuardian => studentGuardian.guardian)
    studentGuardians: StudentGuardian[];

    @OneToMany(() => MedicalInfo, medicalInfo => medicalInfo.consentGivenBy)
    medicalConsents: MedicalInfo[];

    @OneToMany(() => MedicalIncident, medicalIncident => medicalIncident.guardian)
    medicalIncidents: MedicalIncident[];
}