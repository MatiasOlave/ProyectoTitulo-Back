import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { BaseEntity } from '../base.entity';
import { User } from '../auth/user.entity';

@Entity('vehicle_maintenance')
export class VehicleMaintenance extends BaseEntity {
    @ManyToOne(() => Vehicle, vehicle => vehicle.maintenances)
    @JoinColumn({ name: 'vehicle_id' })
    vehicle: Vehicle;

    @Column({ name: 'vehicle_id' })
    vehicleId: string;

    @Column({ name: 'maintenance_type', type: 'varchar', length: 100 })
    maintenanceType: string;

    @Column({ name: 'service_type', type: 'varchar', length: 100 })
    serviceType: string;

    @Column({ name: 'service_date', type: 'date' })
    serviceDate: Date;

    @Column({ name: 'mileage_at_service', type: 'int' })
    mileageAtService: number;

    @Column({ name: 'service_provider', type: 'varchar', length: 255 })
    serviceProvider: string;

    @Column({ name: 'mechanic_name', type: 'varchar', length: 255, nullable: true })
    mechanicName: string;

    @Column({ name: 'invoice_number', type: 'varchar', length: 100, nullable: true })
    invoiceNumber: string;

    @Column({ name: 'labor_cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
    laborCost: number;

    @Column({ name: 'parts_cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
    partsCost: number;

    @Column({ name: 'total_cost', type: 'decimal', precision: 10, scale: 2 })
    totalCost: number;

    @Column({ type: 'text' })
    description: string;

    @Column({ name: 'parts_replaced', type: 'text', nullable: true })
    partsReplaced: string;

    @Column({ name: 'next_service_date', type: 'date', nullable: true })
    nextServiceDate: Date;

    @Column({ name: 'next_service_mileage', type: 'int', nullable: true })
    nextServiceMileage: number;

    @Column({ type: 'json', nullable: true })
    invoices: any;

    @Column({ type: 'json', nullable: true })
    photos: any;

    @Column({ type: 'varchar', length: 50, default: 'completed' })
    status: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'performed_by' })
    performedBy: User;

    @Column({ name: 'performed_by', nullable: true })
    performedById: string;
}