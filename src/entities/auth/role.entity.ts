import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { UserRole } from "./user-role.entity";
import { RolePermission } from "./role-permission.entity";
import { BaseEntity } from "../base.entity";
import { Company } from "../companies/company.entity";

@Entity('roles')
export class Role extends BaseEntity {

    @ManyToOne(() => Company, company => company.roles)
    @JoinColumn({ name: 'company_id' })
    company: Company

    @Column({ name: 'company_id' })
    companyId: string

    @Column({ type: 'varchar', length: 100 })
    name: string

    @Column({ type: 'varchar', length: 50 })
    code: string

    @Column({ type: 'text' })
    description: string

    @Column({ name: 'is_system_role', type: 'boolean', default: false })
    isSystemRole: boolean

    @OneToMany(() => UserRole, userRole => userRole.role)
    userRoles: UserRole[]

    @OneToMany(() => RolePermission, rolePermission => rolePermission.role)
    rolePermissions: RolePermission[]

}