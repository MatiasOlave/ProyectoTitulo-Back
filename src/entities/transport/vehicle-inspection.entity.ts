import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { Driver } from './driver.entity';
import { BaseEntity } from '../base.entity';
import { User } from '../auth/user.entity';

@Entity('vehicle_inspections')
export class VehicleInspection extends BaseEntity {
    @ManyToOne(() => Vehicle, vehicle => vehicle.inspections)
    @JoinColumn({ name: 'vehicle_id' })
    vehicle: Vehicle;

    @Column({ name: 'vehicle_id' })
    vehicleId: string;

    @ManyToOne(() => Driver, driver => driver.vehicleInspections)
    @JoinColumn({ name: 'driver_id' })
    driver: Driver;

    @Column({ name: 'driver_id' })
    driverId: string;

    @Column({ name: 'inspection_date', type: 'date' })
    inspectionDate: Date;

    @Column({ name: 'inspection_time', type: 'time' })
    inspectionTime: string;

    @Column({ type: 'json' })
    checklist: any;

    @Column({ type: 'int' })
    mileage: number;

    @Column({ name: 'fuel_level', type: 'varchar', length: 50 })
    fuelLevel: string;

    @Column({ name: 'overall_status', type: 'varchar', length: 50 })
    overallStatus: string;

    @Column({ name: 'general_observations', type: 'text', nullable: true })
    generalObservations: string;

    @Column({ name: 'issues_found', type: 'text', nullable: true })
    issuesFound: string;

    @Column({ name: 'requires_maintenance', type: 'boolean', default: false })
    requiresMaintenance: boolean;

    @Column({ type: 'json', nullable: true })
    photos: any;

    @Column({ name: 'driver_signature_url', type: 'text', nullable: true })
    driverSignatureUrl: string;

    @Column({ name: 'supervisor_signature_url', type: 'text', nullable: true })
    supervisorSignatureUrl: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'approved_by' })
    approvedBy: User;

    @Column({ name: 'approved_by', nullable: true })
    approvedById: string;

    @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
    approvedAt: Date;
}