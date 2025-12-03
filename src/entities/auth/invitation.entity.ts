import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './role.entity';
import { User } from './user.entity';
import { BaseEntity } from '../base.entity';
import { Student } from '../students/student.entity';
import { Company } from '../companies/company.entity';

@Entity('invitations')
export class Invitation extends BaseEntity {
  
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  firstName: string;

  @Column({ type: 'varchar', length: 255 })
  lastName: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'role_id' })
  roleId: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  token: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'accepted' | 'expired';

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invited_by' })
  invitedBy: User;

  @Column({ name: 'invited_by' })
  invitedById: string;

  @Column({ type: 'timestamp' })
  invitedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt?: Date;
}
