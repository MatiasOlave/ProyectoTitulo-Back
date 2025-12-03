import { Entity, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { Guardian } from './guardian.entity';
import { BaseEntity } from '../base.entity';
import { User } from '../auth/user.entity';

@Entity('medical_info')
export class MedicalInfo extends BaseEntity {
    @OneToOne(() => Student, student => student.medicalInfo)
    @JoinColumn({ name: 'student_id' })
    student: Student;

    @Column({ name: 'student_id' })
    studentId: string;

    @Column({ name: 'blood_type', type: 'varchar', length: 10, nullable: true })
    bloodType: string;

    @Column({ name: 'blood_type_verified', type: 'boolean', default: false })
    bloodTypeVerified: boolean;

    @Column({ name: 'has_allergies', type: 'boolean', default: false })
    hasAllergies: boolean;

    @Column({ type: 'text', nullable: true })
    allergies: string;

    @Column({ name: 'allergy_severity', type: 'varchar', length: 50, nullable: true })
    allergySeverity: string;

    @Column({ name: 'has_dietary_restrictions', type: 'boolean', default: false })
    hasDietaryRestrictions: boolean;

    @Column({ name: 'dietary_restrictions', type: 'text', nullable: true })
    dietaryRestrictions: string;

    @Column({ name: 'dietary_restriction_type', type: 'varchar', length: 100, nullable: true })
    dietaryRestrictionType: string;

    @Column({ name: 'takes_regular_medication', type: 'boolean', default: false })
    takesRegularMedication: boolean;

    @Column({ type: 'text', nullable: true })
    medications: string;

    @Column({ name: 'medication_schedule', type: 'text', nullable: true })
    medicationSchedule: string;

    @Column({ name: 'medication_administration_notes', type: 'text', nullable: true })
    medicationAdministrationNotes: string;

    @Column({ name: 'has_chronic_conditions', type: 'boolean', default: false })
    hasChronicConditions: boolean;

    @Column({ name: 'chronic_conditions', type: 'text', nullable: true })
    chronicConditions: string;

    @Column({ name: 'has_asthma', type: 'boolean', default: false })
    hasAsthma: boolean;

    @Column({ name: 'has_diabetes', type: 'boolean', default: false })
    hasDiabetes: boolean;

    @Column({ name: 'has_epilepsy', type: 'boolean', default: false })
    hasEpilepsy: boolean;

    @Column({ name: 'has_autism', type: 'boolean', default: false })
    hasAutism: boolean;

    @Column({ name: 'has_adhd', type: 'boolean', default: false })
    hasAdhd: boolean;

    @Column({ name: 'health_insurance_provider', type: 'varchar', length: 100, nullable: true })
    healthInsuranceProvider: string;

    @Column({ name: 'health_insurance_type', type: 'varchar', length: 50, nullable: true })
    healthInsuranceType: string;

    @Column({ name: 'health_insurance_number', type: 'varchar', length: 100, nullable: true })
    healthInsuranceNumber: string;

    @Column({ name: 'doctor_name', type: 'varchar', length: 255, nullable: true })
    doctorName: string;

    @Column({ name: 'doctor_specialty', type: 'varchar', length: 100, nullable: true })
    doctorSpecialty: string;

    @Column({ name: 'doctor_phone', type: 'varchar', length: 50, nullable: true })
    doctorPhone: string;

    @Column({ name: 'doctor_email', type: 'varchar', length: 255, nullable: true })
    doctorEmail: string;

    @Column({ name: 'preferred_hospital', type: 'varchar', length: 255, nullable: true })
    preferredHospital: string;

    @Column({ name: 'preferred_hospital_address', type: 'text', nullable: true })
    preferredHospitalAddress: string;

    @Column({ name: 'preferred_hospital_phone', type: 'varchar', length: 50, nullable: true })
    preferredHospitalPhone: string;

    @Column({ name: 'has_special_needs', type: 'boolean', default: false })
    hasSpecialNeeds: boolean;

    @Column({ name: 'special_needs_type', type: 'varchar', length: 100, nullable: true })
    specialNeedsType: string;

    @Column({ name: 'special_needs_description', type: 'text', nullable: true })
    specialNeedsDescription: string;

    @Column({ name: 'requires_special_equipment', type: 'boolean', default: false })
    requiresSpecialEquipment: boolean;

    @Column({ name: 'special_equipment_description', type: 'text', nullable: true })
    specialEquipmentDescription: string;

    @Column({ name: 'vaccination_card_url', type: 'text', nullable: true })
    vaccinationCardUrl: string;

    @Column({ name: 'vaccination_up_to_date', type: 'boolean', nullable: true })
    vaccinationUpToDate: boolean;

    @Column({ name: 'vaccination_notes', type: 'text', nullable: true })
    vaccinationNotes: string;

    @Column({ name: 'general_observations', type: 'text', nullable: true })
    generalObservations: string;

    @Column({ name: 'has_activity_restrictions', type: 'boolean', default: false })
    hasActivityRestrictions: boolean;

    @Column({ name: 'activity_restrictions', type: 'text', nullable: true })
    activityRestrictions: string;

    @Column({ name: 'consent_emergency_treatment', type: 'boolean', default: true })
    consentEmergencyTreatment: boolean;

    @Column({ name: 'consent_medication_administration', type: 'boolean', default: false })
    consentMedicationAdministration: boolean;

    @ManyToOne(() => Guardian, { nullable: true })
    @JoinColumn({ name: 'consent_given_by' })
    consentGivenBy: Guardian;

    @Column({ name: 'consent_given_by', nullable: true })
    consentGivenById: string;

    @Column({ name: 'consent_date', type: 'timestamp', nullable: true })
    consentDate: Date;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'last_updated_by' })
    lastUpdatedBy: User;

    @Column({ name: 'last_updated_by', nullable: true })
    lastUpdatedById: string;

    @Column({ name: 'last_reviewed_date', type: 'date', nullable: true })
    lastReviewedDate: Date;

    @Column({ name: 'next_review_date', type: 'date', nullable: true })
    nextReviewDate: Date;
}