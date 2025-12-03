import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./user.entity";
import { Role } from "./role.entity";
import { BaseEntity } from "../base.entity";

@Entity('user_roles')
export class UserRole extends BaseEntity {
    @ManyToOne(() => User, user => user.userRoles)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id' })
    userId: string

    @ManyToOne(() => Role, role => role.userRoles)
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @Column({ name: 'role_id' })
    roleId: string

    @Column({ name: 'assigned_at', type: 'timestamp' })
    assignedAt: Date

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'assigned_by' })
    assignedBy: User

    @Column({ name: 'assigned_by', nullable: true })
    assignedById: string
}