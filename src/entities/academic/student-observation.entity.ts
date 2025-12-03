import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ClassBookEntry } from './class-book-entry.entity';
import { Student } from '../students/student.entity';
import { BaseEntity } from '../base.entity';

@Entity('student_observations')
export class StudentObservation extends BaseEntity {
    @ManyToOne(() => ClassBookEntry, entry => entry.studentObservations)
    @JoinColumn({ name: 'class_book_entry_id' })
    classBookEntry: ClassBookEntry;

    @Column({ name: 'class_book_entry_id' })
    classBookEntryId: string;

    @ManyToOne(() => Student, student => student.observations)
    @JoinColumn({ name: 'student_id' })
    student: Student;

    @Column({ name: 'student_id' })
    studentId: string;

    @Column({ type: 'text' })
    observation: string;

    @Column({ type: 'varchar', length: 50 })
    category: string;

    @Column({ name: 'development_area', type: 'varchar', length: 100, nullable: true })
    developmentArea: string;

    @Column({ name: 'core_learning', type: 'varchar', length: 100, nullable: true })
    coreLearning: string;

    @Column({ name: 'is_positive', type: 'boolean', default: true })
    isPositive: boolean;

    @Column({ name: 'achievement_level', type: 'varchar', length: 50, nullable: true })
    achievementLevel: string;

    @Column({ name: 'suggested_actions', type: 'text', nullable: true })
    suggestedActions: string;

    @Column({ name: 'requires_follow_up', type: 'boolean', default: false })
    requiresFollowUp: boolean;

    @Column({ name: 'follow_up_date', type: 'date', nullable: true })
    followUpDate: Date;

    @Column({ name: 'is_shared_with_guardian', type: 'boolean', default: false })
    isSharedWithGuardian: boolean;

    @Column({ name: 'shared_at', type: 'timestamp', nullable: true })
    sharedAt: Date;
}