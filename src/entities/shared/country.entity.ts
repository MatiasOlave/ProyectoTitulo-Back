import { Column, Entity, OneToMany } from "typeorm";
import { Region } from "./region.entity";
import { BaseEntity } from "../base.entity";

@Entity('countries')
export class Country extends BaseEntity {
    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 10, unique: true })
    code: string;

    @OneToMany(() => Region, (region) => region.country)
    regions: Region[]
}