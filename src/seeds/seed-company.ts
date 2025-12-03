import { AppDataSource } from '../config/database';
import { authCompanyService } from '../services/auth/auth-company.service';
import { City } from '../entities/shared/city.entity';
import { Region } from '../entities/shared/region.entity';
import { Country } from '../entities/shared/country.entity';

async function seedCompany() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected');

        const cityRepository = AppDataSource.getRepository(City);
        const regionRepository = AppDataSource.getRepository(Region);
        const countryRepository = AppDataSource.getRepository(Country);

        let city = await cityRepository.findOne({ where: {} });

        if (!city) {
            console.log('No city found, checking region...');
            let region = await regionRepository.findOne({ where: {} });

            if (!region) {
                console.log('No region found, checking country...');
                let country = await countryRepository.findOne({ where: {} });

                if (!country) {
                    console.log('No country found, creating one...');
                    country = countryRepository.create({
                        name: 'Chile',
                        code: 'CL'
                    });
                    await countryRepository.save(country);
                }

                console.log('Creating region...');
                region = regionRepository.create({
                    name: 'Región Metropolitana',
                    code: 'RM',
                    countryId: country.id
                });
                await regionRepository.save(region);
            }

            console.log('Creating city...');
            city = cityRepository.create({
                name: 'Santiago',
                code: 'STGO',
                regionId: region.id
            });
            await cityRepository.save(city);
        }

        const companyData = {
            company: {
                name: 'Jardín Infantil Semillitas',
                legalName: 'Semillitas SpA',
                rut: '76.123.456-7',
                email: 'contacto@semillitas.cl',
                phone: '+56912345678',
                address: 'Av. Siempre Viva 123',
                cityId: city.id
            },
            director: {
                firstName: 'María',
                lastName: 'Pérez',
                email: 'director@semillitas.cl',
                password: 'password123',
                rut: '12.345.678-9',
                phone: '+56987654321'
            }
        };

        console.log('Seeding company...');
        const result = await authCompanyService.registerCompany(companyData);
        console.log('Seed successful:', result);

    } catch (error) {
        console.error('Error seeding company:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

seedCompany();
