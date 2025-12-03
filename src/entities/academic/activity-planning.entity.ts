import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { PlanningReview } from './planning-review.entity';
import { BaseEntity } from '../base.entity';
import { Company } from '../companies/company.entity';
import { User } from '../auth/user.entity';
import { Level } from '../students/level.entity';


@Entity('activity_plannings')
export class ActivityPlanning extends BaseEntity {
    @ManyToOne(() => Company, company => company.activityPlannings)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ name: 'company_id' })
    companyId: string;

    @ManyToOne(() => User, user => user.activityPlannings)
    @JoinColumn({ name: 'teacher_id' })
    teacher: User;

    @Column({ name: 'teacher_id' })
    teacherId: string;

    @ManyToOne(() => Level, level => level.activityPlannings)
    @JoinColumn({ name: 'level_id' })
    level: Level;

    @Column({ name: 'level_id' })
    levelId: string;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    code: string;

    @Column({ name: 'planning_type', type: 'varchar', length: 50, nullable: true })
    planningType: string;

    @Column({ name: 'start_date', type: 'date' })
    startDate: Date;

    @Column({ name: 'end_date', type: 'date' })
    endDate: Date;

    @Column({ name: 'academic_year', type: 'varchar', length: 10 })
    academicYear: string;

    @Column({ type: 'text' })
    objectives: string;

    @Column({ name: 'core_learning_areas', type: 'json' })
    coreLearningAreas: any;

    @Column({ type: 'json' })
    activities: any;

    @Column({ type: 'text' })
    resources: string;

    @Column({ name: 'evaluation_criteria', type: 'text' })
    evaluationCriteria: string;

    @Column({ name: 'expected_outcomes', type: 'text' })
    expectedOutcomes: string;

    @Column({ type: 'text', nullable: true })
    adaptations: string;

    @Column({ name: 'student_context', type: 'text', nullable: true })
    studentContext: string;

    @Column({ type: 'varchar', length: 50, default: 'draft' })
    status: string;

    @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
    submittedAt: Date;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'submitted_to' })
    submittedTo: User;

    @Column({ name: 'submitted_to', nullable: true })
    submittedToId: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'reviewed_by' })
    reviewedBy: User;

    @Column({ name: 'reviewed_by', nullable: true })
    reviewedById: string;

    @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
    reviewedAt: Date;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'approved_by' })
    approvedBy: User;

    @Column({ name: 'approved_by', nullable: true })
    approvedById: string;

    @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
    approvedAt: Date;

    @Column({ type: 'text', nullable: true })
    feedback: string;

    @Column({ name: 'revision_number', type: 'int', default: 1 })
    revisionNumber: number;

    @ManyToOne(() => ActivityPlanning, { nullable: true })
    @JoinColumn({ name: 'template_id' })
    template: ActivityPlanning;

    @Column({ name: 'template_id', nullable: true })
    templateId: string;

    @Column({ name: 'is_template', type: 'boolean', default: false })
    isTemplate: boolean;

    @Column({ name: 'template_name', type: 'varchar', length: 255, nullable: true })
    templateName: string;

    @Column({ type: 'json', nullable: true })
    attachments: any;

    @Column({ type: 'int', default: 0 })
    views: number;

    @Column({ name: 'last_viewed_at', type: 'timestamp', nullable: true })
    lastViewedAt: Date;

    @OneToMany(() => PlanningReview, review => review.planning)
    reviews: PlanningReview[];
}