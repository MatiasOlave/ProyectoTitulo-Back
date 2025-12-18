import { Column, Entity } from "typeorm";
import { BaseEntity } from "../base.entity";

@Entity('pricing_configs')
export class PricingConfig extends BaseEntity {
    @Column({ name: 'price_per_student', type: 'decimal', precision: 10, scale: 2 })
    pricePerStudent: number; // 1200 CLP

    @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 4 })
    taxRate: number; // 0.19 para IVA 19%

    @Column({ name: 'effective_from', type: 'date' })
    effectiveFrom: Date;

    @Column({ name: 'effective_until', type: 'date', nullable: true })
    effectiveUntil: Date | null;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'text', nullable: true })
    description: string; // Ej: "Precio estándar", "Promoción verano"

}