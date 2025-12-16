import { DataSource } from 'typeorm';
import { ActivityPlanning } from '../entities/academic/activity-planning.entity';
import { ClassBookEntry } from '../entities/academic/class-book-entry.entity';
import { PlanningReview } from '../entities/academic/planning-review.entity';
import { StudentObservation } from '../entities/academic/student-observation.entity';
import { AttendanceAlert } from '../entities/attendance/attendance-alert.entity';
import { Attendance } from '../entities/attendance/attendance.entity';
import { Invitation } from '../entities/auth/invitation.entity';
import { Permission } from '../entities/auth/permission.entity';
import { RolePermission } from '../entities/auth/role-permission.entity';
import { Role } from '../entities/auth/role.entity';
import { UserRole } from '../entities/auth/user-role.entity';
import { User } from '../entities/auth/user.entity';
import { CompanySubscription } from '../entities/companies/company-subscription.entity';
import { Company } from '../entities/companies/company.entity';
import { SubscriptionPlan } from '../entities/companies/subscription-plan.entity';
import { MedicalIncident } from '../entities/medical/medical-incident.entity';
import { City } from '../entities/shared/city.entity';
import { Country } from '../entities/shared/country.entity';
import { Region } from '../entities/shared/region.entity';
import { EmergencyContact } from '../entities/students/emergency-contact.entity';
import { Guardian } from '../entities/students/guardian.entity';
import { Level } from '../entities/students/level.entity';
import { MedicalInfo } from '../entities/students/medical-info.entity';
import { StudentGuardian } from '../entities/students/student-guardian.entity';
import { Student } from '../entities/students/student.entity';
import { DriverDocumentAlert } from '../entities/transport/driver-document-alert.entity';
import { DriverDocument } from '../entities/transport/driver-document.entity';
import { DriverVehicleAssignment } from '../entities/transport/driver-vehicle-assignment.entity';
import { Driver } from '../entities/transport/driver.entity';
import { RouteStop } from '../entities/transport/route-stop.entity';
import { Route } from '../entities/transport/route.entity';
import { TripStop } from '../entities/transport/trip-stop.entity';
import { Trip } from '../entities/transport/trip.entity';
import { TripIncident } from '../entities/transport/trip.incident.entity';
import { Vehicle } from '../entities/transport/vehicle.entity';
import { VehicleMaintenance } from '../entities/transport/vehicle-maintenance.entity';
import { VehicleInspection } from '../entities/transport/vehicle-inspection.entity';
import { CompanyIsolationSubscriber } from '../subscribers/company-isolation.subscriber';
import { ClassBook } from '../entities/academic/class-books.entity';
import { config } from 'dotenv';

config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'myapp',
  entities: [
    ActivityPlanning,
    ClassBook,
    ClassBookEntry,
    PlanningReview,
    StudentObservation,
    AttendanceAlert,
    Attendance,
    Invitation,
    Permission,
    RolePermission,
    Role,
    UserRole,
    User,
    CompanySubscription,
    Company,
    SubscriptionPlan,
    MedicalIncident,
    City,
    Country,
    Region,
    EmergencyContact,
    Guardian,
    Level,
    MedicalInfo,
    StudentGuardian,
    Student,
    DriverDocumentAlert,
    DriverDocument,
    DriverVehicleAssignment,
    Driver,
    RouteStop,
    Route,
    TripStop,
    Trip,
    TripIncident,
    Vehicle,
    VehicleMaintenance,
    VehicleInspection
  ],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV !== 'production',
  migrations: ['dist/migrations/*.js'],
  subscribers: [CompanyIsolationSubscriber],
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};