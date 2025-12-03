import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';
import { BaseEntity } from '../base.entity';
import { Company } from '../companies/company.entity';

@Entity('role_permissions')
export class RolePermission extends BaseEntity {
    @ManyToOne(() => Role, role => role.rolePermissions)
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @Column({ name: 'role_id' })
    roleId: string;

    @ManyToOne(() => Company, company => company.rolePermissions)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ name: 'company_id' })
    companyId: string;

    @ManyToOne(() => Permission, permission => permission.rolePermissions)
    @JoinColumn({ name: 'permission_id' })
    permission: Permission;

    @Column({ name: 'permission_id' })
    permissionId: string;
}