import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { BaseEntity } from '../base.entity';
import { User } from '../auth/user.entity';

@Entity('emergency_contacts')
export class EmergencyContact extends BaseEntity {
    @ManyToOne(() => Student, student => student.emergencyContacts)
    @JoinColumn({ name: 'student_id' })
    student: Student;

    @Column({ name: 'student_id' })
    studentId: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 100 })
    relationship: string;

    @Column({ type: 'varchar', length: 50 })
    phone: string;

    @Column({ name: 'phone_secondary', type: 'varchar', length: 50, nullable: true })
    phoneSecondary: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    email: string;

    @Column({ type: 'text', nullable: true })
    address: string;

    @Column({ type: 'int', default: 1 })
    priority: number;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'created_by' })
    createdBy: User;

    @Column({ name: 'created_by', nullable: true })
    createdById: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'updated_by' })
    updatedBy: User;

    @Column({ name: 'updated_by', nullable: true })
    updatedById: string;
}