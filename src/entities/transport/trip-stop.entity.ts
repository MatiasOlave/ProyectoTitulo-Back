import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Trip } from './trip.entity';
import { RouteStop } from './route-stop.entity';
import { BaseEntity } from '../base.entity';
import { Student } from '../students/student.entity';
import { Guardian } from '../students/guardian.entity';

@Entity('trip_stops')
export class TripStop extends BaseEntity {
    @ManyToOne(() => Trip, trip => trip.tripStops)
    @JoinColumn({ name: 'trip_id' })
    trip: Trip;

    @Column({ name: 'trip_id' })
    tripId: string;

    @ManyToOne(() => RouteStop, routeStop => routeStop.tripStops)
    @JoinColumn({ name: 'route_stop_id' })
    routeStop: RouteStop;

    @Column({ name: 'route_stop_id' })
    routeStopId: string;

    @ManyToOne(() => Student, student => student.tripStops)
    @JoinColumn({ name: 'student_id' })
    student: Student;

    @Column({ name: 'student_id' })
    studentId: string;

    @Column({ name: 'planned_order', type: 'int' })
    plannedOrder: number;

    @Column({ name: 'actual_order', type: 'float', nullable: true })
    actualOrder: number;

    @Column({ name: 'estimated_arrival_time', type: 'time' })
    estimatedArrivalTime: string;

    @Column({ name: 'actual_arrival_time', type: 'time', nullable: true })
    actualArrivalTime: string;

    @Column({ name: 'actual_departure_time', type: 'time', nullable: true })
    actualDepartureTime: string;

    @Column({ name: 'wait_time_minutes', type: 'int', nullable: true })
    waitTimeMinutes: number;

    @Column({ name: 'actual_latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
    actualLatitude: number;

    @Column({ name: 'actual_longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
    actualLongitude: number;

    @Column({ name: 'distance_from_planned_meters', type: 'int', nullable: true })
    distanceFromPlannedMeters: number;

    @Column({ type: 'varchar', length: 50 })
    status: string;

    @Column({ name: 'student_action', type: 'varchar', length: 50, nullable: true })
    studentAction: string;

    @ManyToOne(() => Guardian, { nullable: true })
    @JoinColumn({ name: 'guardian_present_id' })
    guardianPresent: Guardian;

    @Column({ name: 'guardian_present_id', nullable: true })
    guardianPresentId: string;

    @Column({ name: 'guardian_present_name', type: 'varchar', length: 255, nullable: true })
    guardianPresentName: string;

    @Column({ name: 'id_verified', type: 'boolean', default: false })
    idVerified: boolean;

    @Column({ name: 'action_timestamp', type: 'timestamp', nullable: true })
    actionTimestamp: Date;

    @Column({ name: 'skip_reason', type: 'varchar', length: 100, nullable: true })
    skipReason: string;

    @Column({ name: 'skip_details', type: 'text', nullable: true })
    skipDetails: string;

    @Column({ name: 'approach_notification_sent', type: 'boolean', default: false })
    approachNotificationSent: boolean;

    @Column({ name: 'approach_notification_sent_at', type: 'timestamp', nullable: true })
    approachNotificationSentAt: Date;

    @Column({ name: 'arrival_notification_sent', type: 'boolean', default: false })
    arrivalNotificationSent: boolean;

    @Column({ name: 'arrival_notification_sent_at', type: 'timestamp', nullable: true })
    arrivalNotificationSentAt: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;
}