import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { Driver } from './driver.entity';
import { RouteStop } from './route-stop.entity';
import { Trip } from './trip.entity';
import { BaseEntity } from '../base.entity';
import { Company } from '../companies/company.entity';
import { User } from '../auth/user.entity';

@Entity('routes')
export class Route extends BaseEntity {
    @ManyToOne(() => Company, company => company.routes)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ name: 'company_id' })
    companyId: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    code: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @ManyToOne(() => Vehicle, vehicle => vehicle.routes)
    @JoinColumn({ name: 'vehicle_id' })
    vehicle: Vehicle;

    @Column({ name: 'vehicle_id' })
    vehicleId: string;

    @ManyToOne(() => Driver, driver => driver.primaryRoutes)
    @JoinColumn({ name: 'primary_driver_id' })
    primaryDriver: Driver;

    @Column({ name: 'primary_driver_id' })
    primaryDriverId: string;

    @ManyToOne(() => Driver, { nullable: true })
    @JoinColumn({ name: 'backup_driver_id' })
    backupDriver: Driver;

    @Column({ name: 'backup_driver_id', nullable: true })
    backupDriverId: string;

    @Column({ name: 'route_type', type: 'varchar', length: 50 })
    routeType: string;

    @Column({ name: 'service_type', type: 'varchar', length: 50, default: 'regular' })
    serviceType: string;

    @Column({ name: 'start_location_name', type: 'varchar', length: 255 })
    startLocationName: string;

    @Column({ name: 'start_address', type: 'text' })
    startAddress: string;

    @Column({ name: 'start_latitude', type: 'decimal', precision: 10, scale: 8 })
    startLatitude: number;

    @Column({ name: 'start_longitude', type: 'decimal', precision: 11, scale: 8 })
    startLongitude: number;

    @Column({ name: 'end_location_name', type: 'varchar', length: 255 })
    endLocationName: string;

    @Column({ name: 'end_address', type: 'text' })
    endAddress: string;

    @Column({ name: 'end_latitude', type: 'decimal', precision: 10, scale: 8 })
    endLatitude: number;

    @Column({ name: 'end_longitude', type: 'decimal', precision: 11, scale: 8 })
    endLongitude: number;

    @Column({ name: 'scheduled_start_time', type: 'time' })
    scheduledStartTime: string;

    @Column({ name: 'scheduled_end_time', type: 'time' })
    scheduledEndTime: string;

    @Column({ name: 'estimated_duration_minutes', type: 'int' })
    estimatedDurationMinutes: number;

    @Column({ name: 'estimated_distance_km', type: 'decimal', precision: 8, scale: 2 })
    estimatedDistanceKm: number;

    @Column({ name: 'operating_days', type: 'json', nullable: true })
    operatingDays: any;

    @Column({ name: 'date_exceptions', type: 'json', nullable: true })
    dateExceptions: any;

    @Column({ name: 'max_delay_tolerance_minutes', type: 'int', default: 10 })
    maxDelayToleranceMinutes: number;

    @Column({ name: 'notify_guardians_on_start', type: 'boolean', default: true })
    notifyGuardiansOnStart: boolean;

    @Column({ name: 'notify_guardians_on_approach', type: 'boolean', default: true })
    notifyGuardiansOnApproach: boolean;

    @Column({ name: 'approach_notification_distance_meters', type: 'int', default: 500 })
    approachNotificationDistanceMeters: number;

    @Column({ name: 'is_optimized', type: 'boolean', default: false })
    isOptimized: boolean;

    @Column({ name: 'last_optimized_at', type: 'timestamp', nullable: true })
    lastOptimizedAt: Date;

    @Column({ name: 'optimization_algorithm', type: 'varchar', length: 50, nullable: true })
    optimizationAlgorithm: string;

    @Column({ type: 'varchar', length: 7, nullable: true })
    color: string;

    @Column({ type: 'varchar', length: 50, default: 'active' })
    status: string;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ name: 'total_students', type: 'int', default: 0 })
    totalStudents: number;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'created_by' })
    createdBy: User;

    @Column({ name: 'created_by', nullable: true })
    createdById: string;

    @OneToMany(() => RouteStop, stop => stop.route)
    stops: RouteStop[];

    @OneToMany(() => Trip, trip => trip.route)
    trips: Trip[];
}