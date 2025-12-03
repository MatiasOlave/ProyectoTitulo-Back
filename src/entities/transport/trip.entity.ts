import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Route } from './route.entity';
import { Driver } from './driver.entity';
import { Vehicle } from './vehicle.entity';
import { TripStop } from './trip-stop.entity';
import { TripIncident } from './trip.incident.entity';
import { BaseEntity } from '../base.entity';
import { Company } from '../companies/company.entity';
import { User } from '../auth/user.entity';

@Entity('trips')
export class Trip extends BaseEntity {
    @ManyToOne(() => Company, company => company.trips)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ name: 'company_id' })
    companyId: string;

    @ManyToOne(() => Route, route => route.trips)
    @JoinColumn({ name: 'route_id' })
    route: Route;

    @Column({ name: 'route_id' })
    routeId: string;

    @ManyToOne(() => Driver, driver => driver.trips)
    @JoinColumn({ name: 'driver_id' })
    driver: Driver;

    @Column({ name: 'driver_id' })
    driverId: string;

    @ManyToOne(() => Vehicle, vehicle => vehicle.trips)
    @JoinColumn({ name: 'vehicle_id' })
    vehicle: Vehicle;

    @Column({ name: 'vehicle_id' })
    vehicleId: string;

    @Column({ type: 'date' })
    date: Date;

    @Column({ name: 'trip_type', type: 'varchar', length: 50 })
    tripType: string;

    @Column({ name: 'trip_number', type: 'int', default: 1 })
    tripNumber: number;

    @Column({ name: 'scheduled_start_time', type: 'time' })
    scheduledStartTime: string;

    @Column({ name: 'actual_start_time', type: 'time', nullable: true })
    actualStartTime: string;

    @Column({ name: 'scheduled_end_time', type: 'time', nullable: true })
    scheduledEndTime: string;

    @Column({ name: 'actual_end_time', type: 'time', nullable: true })
    actualEndTime: string;

    @Column({ name: 'actual_duration_minutes', type: 'int', nullable: true })
    actualDurationMinutes: number;

    @Column({ name: 'start_latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
    startLatitude: number;

    @Column({ name: 'start_longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
    startLongitude: number;

    @Column({ name: 'end_latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
    endLatitude: number;

    @Column({ name: 'end_longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
    endLongitude: number;

    @Column({ name: 'start_mileage', type: 'int', nullable: true })
    startMileage: number;

    @Column({ name: 'end_mileage', type: 'int', nullable: true })
    endMileage: number;

    @Column({ name: 'total_distance_km', type: 'decimal', precision: 8, scale: 2, nullable: true })
    totalDistanceKm: number;

    @Column({ type: 'varchar', length: 50, default: 'scheduled' })
    status: string;

    @Column({ name: 'total_students_expected', type: 'int' })
    totalStudentsExpected: number;

    @Column({ name: 'total_students_picked_up', type: 'int', default: 0 })
    totalStudentsPickedUp: number;

    @Column({ name: 'total_students_dropped_off', type: 'int', default: 0 })
    totalStudentsDroppedOff: number;

    @Column({ name: 'students_absent', type: 'int', default: 0 })
    studentsAbsent: number;

    @Column({ name: 'total_stops', type: 'int' })
    totalStops: number;

    @Column({ name: 'completed_stops', type: 'int', default: 0 })
    completedStops: number;

    @Column({ name: 'skipped_stops', type: 'int', default: 0 })
    skippedStops: number;

    @Column({ name: 'is_delayed', type: 'boolean', default: false })
    isDelayed: boolean;

    @Column({ name: 'delay_minutes', type: 'int', nullable: true })
    delayMinutes: number;

    @Column({ name: 'delay_reason', type: 'text', nullable: true })
    delayReason: string;

    @Column({ name: 'has_route_deviation', type: 'boolean', default: false })
    hasRouteDeviation: boolean;

    @Column({ name: 'deviation_reason', type: 'text', nullable: true })
    deviationReason: string;

    @Column({ name: 'weather_conditions', type: 'varchar', length: 100, nullable: true })
    weatherConditions: string;

    @Column({ name: 'traffic_conditions', type: 'varchar', length: 100, nullable: true })
    trafficConditions: string;

    @Column({ name: 'has_incidents', type: 'boolean', default: false })
    hasIncidents: boolean;

    @Column({ name: 'incident_count', type: 'int', default: 0 })
    incidentCount: number;

    @Column({ name: 'fuel_level_start', type: 'varchar', length: 50, nullable: true })
    fuelLevelStart: string;

    @Column({ name: 'fuel_level_end', type: 'varchar', length: 50, nullable: true })
    fuelLevelEnd: string;

    @Column({ name: 'driver_rating', type: 'decimal', precision: 3, scale: 2, nullable: true })
    driverRating: number;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ name: 'driver_comments', type: 'text', nullable: true })
    driverComments: string;

    @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
    cancelledAt: Date;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'cancelled_by' })
    cancelledBy: User;

    @Column({ name: 'cancelled_by', nullable: true })
    cancelledById: string;

    @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
    cancellationReason: string;

    @Column({ name: 'start_notification_sent', type: 'boolean', default: false })
    startNotificationSent: boolean;

    @Column({ name: 'start_notification_sent_at', type: 'timestamp', nullable: true })
    startNotificationSentAt: Date;

    @Column({ name: 'completion_notification_sent', type: 'boolean', default: false })
    completionNotificationSent: boolean;

    @Column({ name: 'completion_notification_sent_at', type: 'timestamp', nullable: true })
    completionNotificationSentAt: Date;

    @OneToMany(() => TripStop, tripStop => tripStop.trip)
    tripStops: TripStop[];

    @OneToMany(() => TripIncident, incident => incident.trip)
    incidents: TripIncident[];
}