import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Region } from './region.entity';
import { BaseEntity } from '../base.entity';
import { Company } from '../companies/company.entity';

@Entity('cities')
export class City extends BaseEntity {

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 10 })
  code: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  longitude?: number;

  @ManyToOne(() => Region, (region) => region.cities)
  @JoinColumn({ name: 'region_id' })
  region: Region;

  @Column({ name: 'region_id' })
  regionId: string

  @OneToMany(() => Company, (company) => company.city)
  companies: Company[]
}
