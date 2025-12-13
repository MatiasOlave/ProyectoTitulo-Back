import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ActivityPlanning } from './activity-planning.entity';
import { BaseEntity } from '../base.entity';
import { User } from '../auth/user.entity';

@Entity('planning_reviews')
export class PlanningReview extends BaseEntity {
    @ManyToOne(() => ActivityPlanning, planning => planning.reviews)
    @JoinColumn({ name: 'planning_id' })
    planning: ActivityPlanning;

    @ManyToOne(() => User, user => user.planningReviews)
    @JoinColumn({ name: 'reviewer_id' })
    reviewer: User;

    @Column({ type: 'varchar', length: 50 })
    action: string;

    @Column({ type: 'text', nullable: true })
    feedback: string;

    @Column({ name: 'checklist_items', type: 'json', nullable: true })
    checklistItems: any;
}