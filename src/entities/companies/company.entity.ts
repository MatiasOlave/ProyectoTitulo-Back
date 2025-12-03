import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { CompanySubscription } from "./company-subscription.entity";
import { BaseEntity } from "../base.entity";
import { City } from "../shared/city.entity";
import { User } from "../auth/user.entity";
import { Role } from "../auth/role.entity";
import { Student } from "../students/student.entity";
import { Guardian } from "../students/guardian.entity";
import { Level } from "../students/level.entity";
import { MedicalIncident } from "../medical/medical-incident.entity";
import { Attendance } from "../attendance/attendance.entity";
import { AttendanceAlert } from "../attendance/attendance-alert.entity";
import { ActivityPlanning } from "../academic/activity-planning.entity";
import { ClassBookEntry } from "../academic/class-book-entry.entity";
import { Driver } from "../transport/driver.entity";
import { Trip } from "../transport/trip.entity";
import { Vehicle } from "../transport/vehicle.entity";
import { TripIncident } from "../transport/trip.incident.entity";
import { DriverDocumentAlert } from "../transport/driver-document-alert.entity";
import { Route } from "../transport/route.entity";

@Entity('companies')
export class Company extends BaseEntity {

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', name: 'legal_name', length: 255 })
  legalName: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  rut: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @ManyToOne(() => City, city => city.companies)
  @JoinColumn({ name: 'city_id' })
  city: City

  @Column({ name: 'city_id' })
  cityId: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => CompanySubscription, subscription => subscription.company)
  subscriptions: CompanySubscription[]

  @OneToMany(() => User, user => user.company)
  users: User[]

  @OneToMany(() => Role, role => role.company)
  roles: Role[]

  @OneToMany(() => Student, student => student.company)
  students: Student[]

  @OneToMany(() => Level, level => level.company)
  levels: Level[]

  @OneToMany(() => Guardian, guardian => guardian.company)
  guardians: Guardian[]

  @OneToMany(() => MedicalIncident, medicalIncident => medicalIncident.company)
  medicalIncidents: MedicalIncident[]

  @OneToMany(() => Attendance, attendance => attendance.company)
  attendances: Attendance[];

  @OneToMany(() => AttendanceAlert, attendanceAlert => attendanceAlert.company)
  attendanceAlerts: AttendanceAlert[];

  @OneToMany(() => ActivityPlanning, planning => planning.company)
  activityPlannings: ActivityPlanning[];

  @OneToMany(() => ClassBookEntry, entry => entry.company)
  classBookEntries: ClassBookEntry[];

  @OneToMany(() => Driver, driver => driver.company)
  drivers: Driver[]

  @OneToMany(() => Trip, trip => trip.company)
  trips: Trip[]

  @OneToMany(() => DriverDocumentAlert, driverDocumentAlert => driverDocumentAlert.company)
  driverDocumentAlerts: DriverDocumentAlert[]

  @OneToMany(() => Route, route => route.company)
  routes: Route[]

  @OneToMany(() => TripIncident, tripIncident => tripIncident.company)
  tripIncidents: TripIncident[]

  @OneToMany(() => Vehicle, vehicle => vehicle.company)
  vehicles: Vehicle[]


}
