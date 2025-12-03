import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { BaseEntity } from '../base.entity';
import { Company } from '../companies/company.entity';
import { Attendance } from '../attendance/attendance.entity';
import { ActivityPlanning } from '../academic/activity-planning.entity';
import { ClassBookEntry } from '../academic/class-book-entry.entity';

@Entity('levels')
export class Level extends BaseEntity {
    @ManyToOne(() => Company, company => company.levels)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ name: 'company_id' })
    companyId: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 50 })
    code: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ name: 'min_age_months', type: 'int' })
    minAgeMonths: number;

    @Column({ name: 'max_age_months', type: 'int' })
    maxAgeMonths: number;

    @Column({ type: 'int' })
    capacity: number;

    @Column({ name: 'academic_year', type: 'varchar', length: 10 })
    academicYear: string;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ name: 'display_order', type: 'int', default: 0 })
    displayOrder: number;

    @OneToMany(() => Student, student => student.level)
    students: Student[];

    @OneToMany(() => Attendance, attendance => attendance.level)
    attendances: Attendance[];

    @OneToMany(() => ActivityPlanning, planning => planning.level)
    activityPlannings: ActivityPlanning[];

    @OneToMany(() => ClassBookEntry, entry => entry.level)
    classBookEntries: ClassBookEntry[];
}