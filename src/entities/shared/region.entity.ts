import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Country } from './country.entity';
import { City } from './city.entity';
import { BaseEntity } from '../base.entity';

@Entity('regions')
export class Region extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  code: string;

  @ManyToOne(() => Country, (country) => country.regions)
  @JoinColumn({ name: 'country_id' })
  country: Country;

  @Column({ name: 'country_id' })
  countryId: string;

  @OneToMany(() => City, (city) => city.region)
  cities: City[];

}
