import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { VehicleMaintenance } from './vehicle-maintenance.entity';
import { VehicleInspection } from './vehicle-inspection.entity';
import { DriverVehicleAssignment } from './driver-vehicle-assignment.entity';
import { Route } from './route.entity';
import { Trip } from './trip.entity';
import { BaseEntity } from '../base.entity';
import { Company } from '../companies/company.entity';

@Entity('vehicles')
export class Vehicle extends BaseEntity {
    @ManyToOne(() => Company, company => company.vehicles)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ name: 'company_id' })
    companyId: string;

    @Column({ name: 'license_plate', type: 'varchar', length: 50, unique: true })
    licensePlate: string;

    @Column({ name: 'internal_code', type: 'varchar', length: 50, nullable: true })
    internalCode: string;

    @Column({ type: 'varchar', length: 100 })
    brand: string;

    @Column({ type: 'varchar', length: 100 })
    model: string;

    @Column({ type: 'int' })
    year: number;

    @Column({ type: 'varchar', length: 50 })
    color: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    vin: string;

    @Column({ type: 'int' })
    capacity: number;

    @Column({ name: 'capacity_students', type: 'int' })
    capacityStudents: number;

    @Column({ name: 'has_wheelchair_access', type: 'boolean', default: false })
    hasWheelchairAccess: boolean;

    @Column({ name: 'wheelchair_capacity', type: 'int', nullable: true })
    wheelchairCapacity: number;

    @Column({ name: 'engine_type', type: 'varchar', length: 50, nullable: true })
    engineType: string;

    @Column({ name: 'fuel_type', type: 'varchar', length: 50, nullable: true })
    fuelType: string;

    @Column({ name: 'current_mileage', type: 'int', nullable: true })
    currentMileage: number;

    @Column({ name: 'last_mileage_update', type: 'date', nullable: true })
    lastMileageUpdate: Date;

    @Column({ name: 'insurance_company', type: 'varchar', length: 255 })
    insuranceCompany: string;

    @Column({ name: 'insurance_policy_number', type: 'varchar', length: 100 })
    insurancePolicyNumber: string;

    @Column({ name: 'insurance_type', type: 'varchar', length: 100, nullable: true })
    insuranceType: string;

    @Column({ name: 'insurance_issue_date', type: 'date', nullable: true })
    insuranceIssueDate: Date;

    @Column({ name: 'insurance_expiry_date', type: 'date' })
    insuranceExpiryDate: Date;

    @Column({ name: 'technical_review_expiry', type: 'date' })
    technicalReviewExpiry: Date;

    @Column({ name: 'circulation_permit_number', type: 'varchar', length: 100, nullable: true })
    circulationPermitNumber: string;

    @Column({ name: 'circulation_permit_expiry', type: 'date' })
    circulationPermitExpiry: Date;

    @Column({ name: 'has_fire_extinguisher', type: 'boolean', default: true })
    hasFireExtinguisher: boolean;

    @Column({ name: 'fire_extinguisher_expiry', type: 'date', nullable: true })
    fireExtinguisherExpiry: Date;

    @Column({ name: 'has_first_aid_kit', type: 'boolean', default: true })
    hasFirstAidKit: boolean;

    @Column({ name: 'has_gps_tracker', type: 'boolean', default: false })
    hasGpsTracker: boolean;

    @Column({ name: 'gps_device_id', type: 'varchar', length: 100, nullable: true })
    gpsDeviceId: string;

    @Column({ name: 'last_maintenance_date', type: 'date', nullable: true })
    lastMaintenanceDate: Date;

    @Column({ name: 'next_maintenance_date', type: 'date', nullable: true })
    nextMaintenanceDate: Date;

    @Column({ name: 'maintenance_frequency_km', type: 'int', nullable: true })
    maintenanceFrequencyKm: number;

    @Column({ name: 'ownership_type', type: 'varchar', length: 50, default: 'owned' })
    ownershipType: string;

    @Column({ name: 'owner_name', type: 'varchar', length: 255, nullable: true })
    ownerName: string;

    @Column({ type: 'varchar', length: 50, default: 'active' })
    status: string;

    @Column({ type: 'varchar', length: 50, default: 'good' })
    condition: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @OneToMany(() => VehicleMaintenance, maintenance => maintenance.vehicle)
    maintenances: VehicleMaintenance[];

    @OneToMany(() => VehicleInspection, inspection => inspection.vehicle)
    inspections: VehicleInspection[];

    @OneToMany(() => DriverVehicleAssignment, assignment => assignment.vehicle)
    driverAssignments: DriverVehicleAssignment[];

    @OneToMany(() => Route, route => route.vehicle)
    routes: Route[];

    @OneToMany(() => Trip, trip => trip.vehicle)
    trips: Trip[];
}