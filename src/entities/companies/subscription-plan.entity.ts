import {
  Entity,
  Column,
  OneToMany,
} from 'typeorm';
import { CompanySubscription } from './company-subscription.entity';
import { BaseEntity } from '../base.entity';

@Entity('subscription_plans')
export class SubscriptionPlan extends BaseEntity {
    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    code: string;

    @Column({ name: 'max_students', type: 'int' })
    maxStudents: number;

    @Column({ name: 'max_users', type: 'int' })
    maxUsers: number;

    @Column({ name: 'monthly_price', type: 'decimal', precision: 10, scale: 2 })
    monthlyPrice: number;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'json', nullable: true })
    features: Record<string, any>;

    @OneToMany(() => CompanySubscription, (subscription) => subscription.subscriptionPlan)
    subscriptions: CompanySubscription[]

}
