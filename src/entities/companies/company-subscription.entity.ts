import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from './company.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import { BaseEntity } from '../base.entity';
@Entity('company_subscriptions')
export class CompanySubscription extends BaseEntity {

  @ManyToOne(() => Company, (company) => company.subscriptions)
  @JoinColumn({ name: 'company_id' })
  company: Company

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => SubscriptionPlan, (subscriptionPlan) => subscriptionPlan.subscriptions)
  @JoinColumn({ name: 'subscription_plan_id' })
  subscriptionPlan: SubscriptionPlan

  @Column({ name: 'subscription_plan_id' })
  subscriptionPlanId: string;

  @Column({ type: 'varchar', length: 255 })
  status: string;

  @Column({ name:'start_date', type: 'datetime' })
  startDate: Date;

  @Column({ name:'end_date', type: 'datetime' })
  endDate: Date;

  @Column({ name: 'auto_renew', default: true, nullable: true })
  autoRenew: boolean;

  @Column({ name: 'cancelled_at', type: 'datetime', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'cancelled_reason', type: 'text', nullable: true })
  cancelledReason: string | null;
}
