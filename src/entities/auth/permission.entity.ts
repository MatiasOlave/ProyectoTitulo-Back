import {  Column, Entity, OneToMany } from "typeorm";
import { RolePermission } from "./role-permission.entity";
import { BaseEntity } from "../base.entity";

@Entity('permissions')
export class Permission extends BaseEntity {

    @Column({ type: 'varchar', length: 100, unique: true })
    name: string;

    @Column({ type: 'varchar', length: 100 })
    resource: string;

    @Column({ type: 'varchar', length: 50 })
    action: string;

    @Column({ type: 'text' })
    description: string;

    @OneToMany(() => RolePermission, rolePermission => rolePermission.permission)
    rolePermissions: RolePermission[]
}