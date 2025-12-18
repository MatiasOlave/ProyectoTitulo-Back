import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BillingPeriod } from "./billing-periods.entity";
import { Student } from "../students/student.entity";
import { BaseEntity } from "../base.entity";

@Entity('student_billing_snapshots')
export class StudentBillingSnapshot extends BaseEntity {
    @ManyToOne(() => BillingPeriod, period => period.studentSnapshots)
    @JoinColumn({ name: 'billing_period_id' })
    billingPeriod: BillingPeriod;

    @Column({ name: 'billing_period_id' })
    billingPeriodId: string;

    @ManyToOne(() => Student, student => student.studentSnapshots)
    @JoinColumn({ name: 'student_id' })
    student: Student;

    @Column({ name: 'student_id' })
    studentId: string;

    @Column({ name: 'student_name', type: 'varchar', length: 255 })
    studentName: string; // Guardado por si el estudiante se elimina

    @Column({ name: 'was_active', type: 'boolean' })
    wasActive: boolean; // true = se facturó, false = no se facturó

    @Column({ name: 'snapshot_date', type: 'datetime' })
    snapshotDate: Date; // Cuándo se tomó el snapshot

    @Column({ type: 'json', nullable: true })
    metadata: Record<string, any>; // Info adicional: nivel, curso, etc.

}