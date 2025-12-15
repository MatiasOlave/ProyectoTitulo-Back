import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { Guardian } from './guardian.entity';
import { BaseEntity } from '../base.entity';
import { User } from '../auth/user.entity';
import { Company } from '../companies/company.entity';

@Entity('student_guardians')
export class StudentGuardian extends BaseEntity {
    @ManyToOne(() => Company, company => company.studentGuardians)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ name: 'company_id' })
    companyId: string;

    @ManyToOne(() => Student, student => student.studentGuardians)
    @JoinColumn({ name: 'student_id' })
    student: Student;

    @Column({ name: 'student_id' })
    studentId: string;

    @ManyToOne(() => Guardian, guardian => guardian.studentGuardians)
    @JoinColumn({ name: 'guardian_id' })
    guardian: Guardian;

    @Column({ name: 'guardian_id' })
    guardianId: string;

    @Column({ name: 'relationship_type', type: 'varchar', length: 100 })
    relationshipType: string;

    @Column({ type: 'int', default: 1 })
    priority: number;

    @Column({ name: 'can_pickup', type: 'boolean', default: true })
    canPickup: boolean;

    @Column({ name: 'can_receive_communications', type: 'boolean', default: true })
    canReceiveCommunications: boolean;

    @Column({ name: 'can_authorize_medical', type: 'boolean', default: false })
    canAuthorizeMedical: boolean;

    @Column({ name: 'can_see_academic_info', type: 'boolean', default: true })
    canSeeAcademicInfo: boolean;

    @Column({ name: 'has_legal_custody', type: 'boolean', default: true })
    hasLegalCustody: boolean;

    @Column({ name: 'custody_type', type: 'varchar', length: 50, nullable: true })
    custodyType: string;

    @Column({ name: 'custody_notes', type: 'text', nullable: true })
    custodyNotes: string;

    @Column({ name: 'lives_with_student', type: 'boolean', default: true })
    livesWithStudent: boolean;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'created_by' })
    createdBy: User;

    @Column({ name: 'created_by', nullable: true })
    createdById: string;
}