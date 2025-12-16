import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { StudentObservation } from './student-observation.entity';
import { BaseEntity } from '../base.entity';
import { Company } from '../companies/company.entity';
import { User } from '../auth/user.entity';
import { Level } from '../students/level.entity';
import { ClassBook } from './class-books.entity';


@Entity('class_book_entries')
export class ClassBookEntry extends BaseEntity {
    @ManyToOne(() => Company, company => company.classBookEntries)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ name: 'company_id' })
    companyId: string;

    @ManyToOne(() => User, user => user.classBookEntries)
    @JoinColumn({ name: 'teacher_id' })
    teacher: User;

    @Column({ name: 'teacher_id' })
    teacherId: string;

    @ManyToOne(() => Level, level => level.classBookEntries)
    @JoinColumn({ name: 'level_id' })
    level: Level;

    @Column({ name: 'level_id' })
    levelId: string;

    @Column({ type: 'date' })
    date: Date;

    @Column({ name: 'entry_number', type: 'varchar', length: 50, nullable: true })
    entryNumber: string;

    @Column({ name: 'academic_year', type: 'varchar', length: 10 })
    academicYear: string;

    @Column({ name: 'total_students', type: 'int' })
    totalStudents: number;

    @Column({ name: 'students_present', type: 'int' })
    studentsPresent: number;

    @Column({ name: 'students_absent', type: 'int' })
    studentsAbsent: number;

    @Column({ name: 'students_late', type: 'int' })
    studentsLate: number;

    @Column({ name: 'attendance_percentage', type: 'decimal', precision: 5, scale: 2 })
    attendancePercentage: number;

    @Column({ name: 'activities_performed', type: 'text' })
    activitiesPerformed: string;

    @Column({ name: 'core_learning_areas', type: 'json', nullable: true })
    coreLearningAreas: any;

    @Column({ name: 'resources_used', type: 'text' })
    resourcesUsed: string;

    @Column({ name: 'teaching_methodology', type: 'varchar', length: 100, nullable: true })
    teachingMethodology: string;

    @Column({ name: 'learning_environment', type: 'text', nullable: true })
    learningEnvironment: string;

    @Column({ name: 'general_observations', type: 'text', nullable: true })
    generalObservations: string;

    @Column({ type: 'text', nullable: true })
    achievements: string;

    @Column({ type: 'text', nullable: true })
    challenges: string;

    @Column({ type: 'text', nullable: true })
    incidents: string;

    @Column({ name: 'special_activities', type: 'text', nullable: true })
    specialActivities: string;

    @Column({ name: 'family_communications', type: 'text', nullable: true })
    familyCommunications: string;

    @Column({ type: 'json', nullable: true })
    photos: any;

    @Column({ type: 'json', nullable: true })
    documents: any;

    @Column({ type: 'varchar', length: 50, default: 'draft' })
    status: string;

    @Column({ name: 'is_locked', type: 'boolean', default: false })
    isLocked: boolean;

    @Column({ name: 'locked_at', type: 'timestamp', nullable: true })
    lockedAt: Date;

    @ManyToOne(() => ClassBook, classBook => classBook.entries, { nullable: true })
    @JoinColumn({ name: 'class_book_id' })
    classBook: ClassBook;

    @Column({ name: 'class_book_id', nullable: true })
    classBookId: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'locked_by' })
    lockedBy: User;

    @Column({ name: 'locked_by', nullable: true })
    lockedById: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'reviewed_by' })
    reviewedBy: User;

    @Column({ name: 'reviewed_by', nullable: true })
    reviewedById: string;

    @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
    reviewedAt: Date;

    @Column({ name: 'review_notes', type: 'text', nullable: true })
    reviewNotes: string;

    @OneToMany(() => StudentObservation, observation => observation.classBookEntry)
    studentObservations: StudentObservation[];
}