import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Driver } from './driver.entity';
import { Vehicle } from './vehicle.entity';
import { BaseEntity } from '../base.entity';
import { User } from '../auth/user.entity';

@Entity('driver_vehicle_assignments')
export class DriverVehicleAssignment extends BaseEntity {
    @ManyToOne(() => Driver, driver => driver.vehicleAssignments)
    @JoinColumn({ name: 'driver_id' })
    driver: Driver;

    @Column({ name: 'driver_id' })
    driverId: string;

    @ManyToOne(() => Vehicle, vehicle => vehicle.driverAssignments)
    @JoinColumn({ name: 'vehicle_id' })
    vehicle: Vehicle;

    @Column({ name: 'vehicle_id' })
    vehicleId: string;

    @Column({ name: 'assignment_date', type: 'date' })
    assignmentDate: Date;

    @Column({ name: 'unassignment_date', type: 'date', nullable: true })
    unassignmentDate: Date;

    @Column({ name: 'is_primary_driver', type: 'boolean', default: true })
    isPrimaryDriver: boolean;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'assigned_by' })
    assignedBy: User;

    @Column({ name: 'assigned_by' })
    assignedById: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'unassigned_by' })
    unassignedBy: User;

    @Column({ name: 'unassigned_by', nullable: true })
    unassignedById: string;

    @Column({ name: 'unassignment_reason', type: 'text', nullable: true })
    unassignmentReason: string;

    @Column({ type: 'text', nullable: true })
    notes: string;
}