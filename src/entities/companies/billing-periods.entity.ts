import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { CompanySubscription } from "./company-subscription.entity";
import { StudentBillingSnapshot } from "./student-billing.entity";
import { BaseEntity } from "../base.entity";

@Entity('billing_periods')
export class BillingPeriod extends BaseEntity {
    @ManyToOne(() => CompanySubscription, sub => sub.billingPeriods)
    @JoinColumn({ name: 'subscription_id' })
    subscription: CompanySubscription;

    @Column({ name: 'subscription_id' })
    subscriptionId: string;

    @Column({ name: 'period_start', type: 'date' })
    periodStart: Date; // Ej: 2025-01-01

    @Column({ name: 'period_end', type: 'date' })
    periodEnd: Date; // Ej: 2025-01-31

    @Column({ name: 'billing_date', type: 'date' })
    billingDate: Date; // Cuándo se generó la factura (ej: 2025-02-01)

    // === CONTEO DE ESTUDIANTES ===
    @Column({ name: 'active_students_count', type: 'int' })
    activeStudentsCount: number; // Estudiantes activos al momento de facturar

    // === CÁLCULOS ===
    @Column({ name: 'price_per_student', type: 'decimal', precision: 10, scale: 2 })
    pricePerStudent: number; // Guardado por si cambia en el futuro

    @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 4 })
    taxRate: number; // Guardado por si cambia

    @Column({ name: 'subtotal', type: 'decimal', precision: 12, scale: 2 })
    subtotal: number; // activeStudentsCount * pricePerStudent

    @Column({ name: 'tax_amount', type: 'decimal', precision: 12, scale: 2 })
    taxAmount: number; // subtotal * taxRate

    @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2 })
    totalAmount: number; // subtotal + taxAmount

    // === ESTADO DE PAGO ===
    @Column({ type: 'varchar', length: 20 })
    status: string; // 'pending', 'sent', 'paid', 'overdue', 'cancelled'

    @Column({ name: 'invoice_number', type: 'varchar', length: 50, nullable: true, unique: true })
    invoiceNumber: string | null; // Número de factura generado

    @Column({ name: 'invoice_url', type: 'text', nullable: true })
    invoiceUrl: string | null; // URL del PDF de factura

    @Column({ name: 'sent_at', type: 'datetime', nullable: true })
    sentAt: Date | null; // Cuándo se envió la factura

    @Column({ name: 'paid_at', type: 'datetime', nullable: true })
    paidAt: Date | null; // Cuándo se registró el pago

    @Column({ name: 'payment_reference', type: 'varchar', length: 255, nullable: true })
    paymentReference: string | null; // Número de transferencia, ID transacción, etc.

    @Column({ name: 'due_date', type: 'date', nullable: true })
    dueDate: Date | null; // Fecha límite de pago

    // === NOTAS Y METADATA ===
    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @Column({ type: 'json', nullable: true })
    metadata: Record<string, any>; // Descuentos aplicados, ajustes manuales, etc.

    @OneToMany(() => StudentBillingSnapshot, snapshot => snapshot.billingPeriod)
    studentSnapshots: StudentBillingSnapshot[];
}
