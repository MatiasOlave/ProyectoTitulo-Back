import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Trip } from './trip.entity';
import { BaseEntity } from '../base.entity';
import { Company } from '../companies/company.entity';
import { User } from '../auth/user.entity';

@Entity('trip_incidents')
export class TripIncident extends BaseEntity {
    @ManyToOne(() => Trip, trip => trip.incidents)
    @JoinColumn({ name: 'trip_id' })
    trip: Trip;

    @Column({ name: 'trip_id' })
    tripId: string;

    @ManyToOne(() => Company, company => company.tripIncidents)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ name: 'company_id' })
    companyId: string;

    @Column({ name: 'incident_type', type: 'varchar', length: 100 })
    incidentType: string;

    @Column({ name: 'incident_category', type: 'varchar', length: 50 })
    incidentCategory: string;

    @Column({ type: 'varchar', length: 50 })
    severity: string;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 8 })
    latitude: number;

    @Column({ type: 'decimal', precision: 11, scale: 8 })
    longitude: number;

    @Column({ name: 'location_description', type: 'text', nullable: true })
    locationDescription: string;

    @Column({ name: 'occurred_at', type: 'timestamp' })
    occurredAt: Date;

    @Column({ name: 'reported_at', type: 'timestamp' })
    reportedAt: Date;

    @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
    resolvedAt: Date;

    @Column({ name: 'resolution_time_minutes', type: 'int', nullable: true })
    resolutionTimeMinutes: number;

    @Column({ name: 'reported_by_driver', type: 'boolean', default: true })
    reportedByDriver: boolean;

    @Column({ name: 'students_involved', type: 'json', nullable: true })
    studentsInvolved: any;

    @Column({ name: 'caused_delay', type: 'boolean', default: false })
    causedDelay: boolean;

    @Column({ name: 'delay_minutes', type: 'int', nullable: true })
    delayMinutes: number;

    @Column({ name: 'required_route_change', type: 'boolean', default: false })
    requiredRouteChange: boolean;

    @Column({ name: 'required_assistance', type: 'boolean', default: false })
    requiredAssistance: boolean;

    @Column({ name: 'assistance_type', type: 'varchar', length: 100, nullable: true })
    assistanceType: string;

    @Column({ name: 'assistance_called_at', type: 'timestamp', nullable: true })
    assistanceCalledAt: Date;

    @Column({ name: 'assistance_arrived_at', type: 'timestamp', nullable: true })
    assistanceArrivedAt: Date;

    @Column({ name: 'police_notified', type: 'boolean', default: false })
    policeNotified: boolean;

    @Column({ name: 'police_report_number', type: 'varchar', length: 100, nullable: true })
    policeReportNumber: string;

    @Column({ name: 'ambulance_called', type: 'boolean', default: false })
    ambulanceCalled: boolean;

    @Column({ name: 'guardians_notified', type: 'boolean', default: false })
    guardiansNotified: boolean;

    @Column({ name: 'guardians_notified_at', type: 'timestamp', nullable: true })
    guardiansNotifiedAt: Date;

    @Column({ name: 'company_notified', type: 'boolean', default: false })
    companyNotified: boolean;

    @Column({ name: 'company_notified_at', type: 'timestamp', nullable: true })
    companyNotifiedAt: Date;

    @Column({ name: 'notification_message', type: 'text', nullable: true })
    notificationMessage: string;

    @Column({ name: 'actions_taken', type: 'text' })
    actionsTaken: string;

    @Column({ name: 'estimated_cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
    estimatedCost: number;

    @Column({ name: 'actual_cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
    actualCost: number;

    @Column({ type: 'json', nullable: true })
    photos: any;

    @Column({ type: 'json', nullable: true })
    videos: any;

    @Column({ type: 'json', nullable: true })
    documents: any;

    @Column({ name: 'requires_follow_up', type: 'boolean', default: false })
    requiresFollowUp: boolean;

    @Column({ name: 'follow_up_action', type: 'text', nullable: true })
    followUpAction: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'follow_up_responsible' })
    followUpResponsible: User;

    @Column({ name: 'follow_up_responsible', nullable: true })
    followUpResponsibleId: string;

    @Column({ name: 'follow_up_deadline', type: 'date', nullable: true })
    followUpDeadline: Date;

    @Column({ name: 'follow_up_completed', type: 'boolean', default: false })
    followUpCompleted: boolean;

    @Column({ name: 'follow_up_completed_at', type: 'timestamp', nullable: true })
    followUpCompletedAt: Date;

    @Column({ type: 'varchar', length: 50, default: 'open' })
    status: string;

    @Column({ type: 'boolean', nullable: true })
    preventable: boolean;

    @Column({ name: 'prevention_measures', type: 'text', nullable: true })
    preventionMeasures: string;
}