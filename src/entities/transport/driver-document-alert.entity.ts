import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Driver } from './driver.entity';
import { DriverDocument } from './driver-document.entity';
import { BaseEntity } from '../base.entity';
import { Company } from '../companies/company.entity';
import { User } from '../auth/user.entity';


@Entity('driver_document_alerts')
export class DriverDocumentAlert extends BaseEntity {
    @ManyToOne(() => Company, company => company.driverDocumentAlerts)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ name: 'company_id' })
    companyId: string;

    @ManyToOne(() => Driver, driver => driver.documentAlerts)
    @JoinColumn({ name: 'driver_id' })
    driver: Driver;

    @Column({ name: 'driver_id' })
    driverId: string;

    @ManyToOne(() => DriverDocument, document => document.alerts)
    @JoinColumn({ name: 'document_id' })
    document: DriverDocument;

    @Column({ name: 'document_id' })
    documentId: string;

    @Column({ name: 'alert_type', type: 'varchar', length: 50 })
    alertType: string;

    @Column({ type: 'varchar', length: 50 })
    severity: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ name: 'days_until_expiry', type: 'int', nullable: true })
    daysUntilExpiry: number;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'boolean', default: false })
    acknowledged: boolean;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'acknowledged_by' })
    acknowledgedBy: User;

    @Column({ name: 'acknowledged_by', nullable: true })
    acknowledgedById: string;

    @Column({ name: 'acknowledged_at', type: 'timestamp', nullable: true })
    acknowledgedAt: Date;

    @Column({ type: 'boolean', default: false })
    resolved: boolean;

    @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
    resolvedAt: Date;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'resolved_by' })
    resolvedBy: User;

    @Column({ name: 'resolved_by', nullable: true })
    resolvedById: string;

    @Column({ name: 'resolution_notes', type: 'text', nullable: true })
    resolutionNotes: string;
}