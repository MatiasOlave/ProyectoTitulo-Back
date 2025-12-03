import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Route } from './route.entity';
import { TripStop } from './trip-stop.entity';
import { BaseEntity } from '../base.entity';
import { Student } from '../students/student.entity';
import { User } from '../auth/user.entity';

@Entity('route_stops')
export class RouteStop extends BaseEntity {
    @ManyToOne(() => Route, route => route.stops)
    @JoinColumn({ name: 'route_id' })
    route: Route;

    @Column({ name: 'route_id' })
    routeId: string;

    @ManyToOne(() => Student, student => student.routeStops)
    @JoinColumn({ name: 'student_id' })
    student: Student;

    @Column({ name: 'student_id' })
    studentId: string;

    @Column({ name: 'stop_order', type: 'int' })
    stopOrder: number;

    @Column({ name: 'stop_name', type: 'varchar', length: 255, nullable: true })
    stopName: string;

    @Column({ type: 'text' })
    address: string;

    @Column({ name: 'address_reference', type: 'text', nullable: true })
    addressReference: string;

    @Column({ type: 'decimal', precision: 10, scale: 8 })
    latitude: number;

    @Column({ type: 'decimal', precision: 11, scale: 8 })
    longitude: number;

    @Column({ name: 'location_accuracy_meters', type: 'int', nullable: true })
    locationAccuracyMeters: number;

    @Column({ name: 'stop_type', type: 'varchar', length: 50, default: 'regular' })
    stopType: string;

    @Column({ name: 'authorized_guardians', type: 'json' })
    authorizedGuardians: any;

    @Column({ name: 'estimated_time_from_start_minutes', type: 'int' })
    estimatedTimeFromStartMinutes: number;

    @Column({ name: 'estimated_arrival_time', type: 'time', nullable: true })
    estimatedArrivalTime: string;

    @Column({ name: 'typical_wait_time_minutes', type: 'int', default: 2 })
    typicalWaitTimeMinutes: number;

    @Column({ name: 'pickup_instructions', type: 'text', nullable: true })
    pickupInstructions: string;

    @Column({ name: 'special_requirements', type: 'text', nullable: true })
    specialRequirements: string;

    @Column({ name: 'contact_phone', type: 'varchar', length: 50, nullable: true })
    contactPhone: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'created_by' })
    createdBy: User;

    @Column({ name: 'created_by', nullable: true })
    createdById: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ name: 'is_temporary', type: 'boolean', default: false })
    isTemporary: boolean;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ name: 'valid_until', type: 'date', nullable: true })
    validUntil: Date;

    @Column({ name: 'valid_from', type: 'date', nullable: true })
    validFrom: Date;

    @Column({ name: 'operating_days', type: 'json', nullable: true })
    operatingDays: any;

    @Column({ name: 'applies_sunday', type: 'boolean', default: false })
    appliesSunday: boolean;

    @Column({ name: 'applies_saturday', type: 'boolean', default: false })
    appliesSaturday: boolean;

    @Column({ name: 'applies_friday', type: 'boolean', default: true })
    appliesFriday: boolean;

    @Column({ name: 'applies_thursday', type: 'boolean', default: true })
    appliesThursday: boolean;

    @Column({ name: 'applies_wednesday', type: 'boolean', default: true })
    appliesWednesday: boolean;

    @Column({ name: 'applies_tuesday', type: 'boolean', default: true })
    appliesTuesday: boolean;

    @Column({ name: 'applies_monday', type: 'boolean', default: true })
    appliesMonday: boolean;

    @Column({ name: 'geofence_radius_meters', type: 'int', default: 100 })
    geofenceRadiusMeters: number;

    @Column({ name: 'alternative_contact_phone', type: 'varchar', length: 50, nullable: true })
    alternativeContactPhone: string;

    @OneToMany(() => TripStop, tripStop => tripStop.routeStop)
    tripStops: TripStop[];
}