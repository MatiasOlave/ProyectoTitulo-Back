import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Driver } from './driver.entity';
import { DriverDocumentAlert } from './driver-document-alert.entity';
import { BaseEntity } from '../base.entity';
import { User } from '../auth/user.entity';

@Entity('driver_documents')
export class DriverDocument extends BaseEntity {
    @ManyToOne(() => Driver, driver => driver.documents)
    @JoinColumn({ name: 'driver_id' })
    driver: Driver;

    @Column({ name: 'driver_id' })
    driverId: string;

    @Column({ name: 'document_type', type: 'varchar', length: 50 })
    documentType: string;

    @Column({ name: 'document_name', type: 'varchar', length: 255 })
    documentName: string;

    @Column({ name: 'file_url', type: 'text' })
    fileUrl: string;

    @Column({ name: 'file_name', type: 'varchar', length: 255 })
    fileName: string;

    @Column({ name: 'file_size', type: 'int' })
    fileSize: number;

    @Column({ name: 'mime_type', type: 'varchar', length: 100 })
    mimeType: string;

    @Column({ name: 'issue_date', type: 'date', nullable: true })
    issueDate: Date;

    @Column({ name: 'expiry_date', type: 'date', nullable: true })
    expiryDate: Date;

    @Column({ name: 'is_permanent', type: 'boolean', default: false })
    isPermanent: boolean;

    @Column({ type: 'varchar', length: 50, default: 'valid' })
    status: string;

    @Column({ type: 'boolean', default: false })
    verified: boolean;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'verified_by' })
    verifiedBy: User;

    @Column({ name: 'verified_by', nullable: true })
    verifiedById: string;

    @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
    verifiedAt: Date;

    @Column({ name: 'verification_notes', type: 'text', nullable: true })
    verificationNotes: string;

    @Column({ name: 'reminder_sent', type: 'boolean', default: false })
    reminderSent: boolean;

    @Column({ name: 'reminder_sent_at', type: 'timestamp', nullable: true })
    reminderSentAt: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'uploaded_by' })
    uploadedBy: User;

    @Column({ name: 'uploaded_by' })
    uploadedById: string;

    @Column({ name: 'uploaded_at', type: 'timestamp' })
    uploadedAt: Date;

    @OneToMany(() => DriverDocumentAlert, alert => alert.document)
    alerts: DriverDocumentAlert[];
}