import { ManyToOne, JoinColumn, OneToMany, Entity, Column } from 'typeorm';
import { Company } from './company.entity';
import { BaseEntity } from '../base.entity';
import { BillingPeriod } from './billing-periods.entity';

@Entity('company_subscriptions')
export class CompanySubscription extends BaseEntity {

  @ManyToOne(() => Company, (company) => company.subscriptions)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ type: 'varchar', length: 20 })
  status: string; // 'active', 'suspended', 'cancelled'

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date | null;

  @Column({ name: 'auto_renew', type: 'boolean', default: true })
  autoRenew: boolean;

  @Column({ name: 'cancelled_at', type: 'datetime', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'cancelled_reason', type: 'text', nullable: true })
  cancelledReason: string | null;

  @Column({ name: 'payment_method', type: 'varchar', length: 50, nullable: true })
  paymentMethod: string; // 'transfer', 'card', 'invoice'

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>; // Info adicional: contacto facturación, etc.

  @OneToMany(() => BillingPeriod, period => period.subscription)
  billingPeriods: BillingPeriod[];

}