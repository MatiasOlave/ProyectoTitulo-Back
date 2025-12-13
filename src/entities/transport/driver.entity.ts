import { Column, Entity, JoinColumn, ManyToOne, OneToMany, ValueTransformer } from "typeorm";
import { DriverDocument } from "./driver-document.entity";
import { DriverDocumentAlert } from "./driver-document-alert.entity";
import { VehicleInspection } from "./vehicle-inspection.entity";
import { DriverVehicleAssignment } from "./driver-vehicle-assignment.entity";
import { Route } from "./route.entity";
import { Trip } from "./trip.entity";
import { BaseEntity } from "../base.entity";
import { Company } from "../companies/company.entity";
import { User } from "../auth/user.entity";
import { City } from "../shared/city.entity";

// Transformer to handle date columns as pure YYYY-MM-DD strings
export const dateTransformer: ValueTransformer = {
    to: (value: any) => {
        if (!value) return null;
        if (value instanceof Date) return value.toISOString().split('T')[0];
        return value; // Assume string YYYY-MM-DD
    },
    from: (value: any) => {
        if (!value) return null;
        // Return as string YYYY-MM-DD directly, do NOT convert to Date
        // If the driver returns a Date object, convert to string safely
        if (value instanceof Date) return value.toISOString().split('T')[0];
        return value; // Should be string from Postgres
    }
};

@Entity('drivers')
export class Driver extends BaseEntity {
    @ManyToOne(() => Company, company => company.drivers)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ name: 'company_id' })
    companyId: string

    @ManyToOne(() => User, user => user.drivers)
    @JoinColumn({ name: 'user_id' })
    user: User

    @Column({ name: 'user_id' })
    userId: string

    @Column({ name: 'first_name', type: 'varchar', length: 255 })
    firstName: string

    @Column({ name: 'last_name', type: 'varchar', length: 255 })
    lastName: string

    @Column({ type: 'varchar', length: 50 })
    rut: string

    @Column({ name: 'birth_date', type: 'date', transformer: dateTransformer })
    birthDate: string;

    @Column({ type: 'varchar', length: 50 })
    phone: string

    @Column({ name: 'phone_secondary', type: 'varchar', length: 50, nullable: true })
    phoneSecondary: string

    @Column({ name: 'email', type: 'varchar', length: 255 })
    email: string

    @Column({ type: 'text' })
    address: string

    @ManyToOne(() => City, { nullable: true })
    @JoinColumn({ name: 'city_id' })
    city: City

    @Column({ name: 'city_id', nullable: true })
    cityId: string

    @Column({ type: 'varchar', length: 255 })
    emergencyContactName: string

    @Column({ name: 'emergency_contact_relationship', type: 'varchar', length: 100 })
    emergencyContactRelationship: string

    @Column({ name: 'emergency_contact_phone', type: 'varchar', length: 50 })
    emergencyContactPhone: string

    @Column({ name: 'emergency_contact_phone_secondary', type: 'varchar', length: 50, nullable: true })
    emergencyContactPhoneSecondary: string

    @Column({ name: 'license_number', type: 'varchar', length: 100 })
    licenseNumber: string

    @Column({ name: 'license_type', type: 'varchar', length: 50 })
    licenseType: string

    @Column({ name: 'license_issue_date', type: 'date', transformer: dateTransformer })
    licenseIssueDate: string

    @Column({ name: 'license_expiration_date', type: 'date', transformer: dateTransformer })
    licenseExpirationDate: string

    @Column({ name: 'license_restriction', type: 'text', nullable: true })
    licenseRestrictions: string

    @Column({ name: 'years_of_experience', type: 'int' })
    yearsOfExperience: number

    @Column({ name: 'previous_experience', type: 'text', nullable: true })
    previousExperience: string

    @Column({ name: 'last_medical_exam_date', type: 'date', nullable: true, transformer: dateTransformer })
    lastMedicalExamDate: string

    @Column({ name: 'next_medical_exam_date', type: 'date', nullable: true, transformer: dateTransformer })
    nextMedicalExamDate: string

    @Column({ name: 'medical_restriction', type: 'text', nullable: true })
    medicalRestrictions: string

    @Column({ name: 'status', type: 'varchar', length: 50 })
    status: string

    @Column({ name: 'suspension_reason', type: 'text', nullable: true })
    suspensionReason: string

    @Column({ name: 'suspension_start_date', type: 'date', nullable: true, transformer: dateTransformer })
    suspensionStartDate: string

    @Column({ name: 'suspension_end_date', type: 'date', nullable: true, transformer: dateTransformer })
    suspensionEndDate: string

    @Column({ name: 'hire_date', type: 'date', transformer: dateTransformer })
    hire_date: string

    @Column({ name: 'termination_date', type: 'date', nullable: true, transformer: dateTransformer })
    termination_date: string

    @OneToMany(() => DriverDocument, document => document.driver)
    documents: DriverDocument[];

    @OneToMany(() => DriverDocumentAlert, alert => alert.driver)
    documentAlerts: DriverDocumentAlert[];

    @OneToMany(() => VehicleInspection, inspection => inspection.driver)
    vehicleInspections: VehicleInspection[];

    @OneToMany(() => DriverVehicleAssignment, assignment => assignment.driver)
    vehicleAssignments: DriverVehicleAssignment[];

    @OneToMany(() => Route, route => route.primaryDriver)
    primaryRoutes: Route[];

    @OneToMany(() => Route, route => route.backupDriver)
    backupRoutes: Route[];

    @OneToMany(() => Trip, trip => trip.driver)
    trips: Trip[];
}