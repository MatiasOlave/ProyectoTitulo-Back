import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { Company } from '../companies/company.entity';
import { Level } from '../students/level.entity';
import { User } from '../auth/user.entity';
import { ClassBookEntry } from './class-book-entry.entity';

@Entity('class_books')
export class ClassBook extends BaseEntity {
    @ManyToOne(() => Company)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ name: 'company_id' })
    companyId: string;

    @ManyToOne(() => Level)
    @JoinColumn({ name: 'level_id' })
    level: Level;

    @Column({ name: 'level_id' })
    levelId: string;

    // Relación con el Profesor Jefe (Encargado del libro)
    @ManyToOne(() => User)
    @JoinColumn({ name: 'head_teacher_id' })
    headTeacher: User;

    @Column({ name: 'head_teacher_id' })
    headTeacherId: string;

    @Column({ name: 'academic_year', type: 'varchar', length: 10 })
    academicYear: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    name: string;

    @Column({ type: 'varchar', length: 50, default: 'active' })
    status: string;

    @Column({ name: 'opened_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    openedAt: Date;

    @Column({ name: 'closed_at', type: 'datetime', nullable: true })
    closedAt: Date;

    // Auditoría de quién creó el libro
    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    createdBy: User;

    @Column({ name: 'created_by' })
    createdById: string;

    // Relación inversa: Un Libro tiene muchas Entradas (Páginas)
    // Nota: Deberás agregar @ManyToOne en ClassBookEntry para que esto funcione bidireccionalmente
    @OneToMany(() => ClassBookEntry, entry => entry.classBook)
    entries: ClassBookEntry[];

}