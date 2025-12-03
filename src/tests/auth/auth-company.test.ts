import request from 'supertest';
import express from 'express';
import { AppDataSource } from '../../config/database';
import { authCompanyRoutes } from '../../routes/auth/auth-company.route';
import { Company } from '../../entities/companies/company.entity';
import { User } from '../../entities/auth/user.entity';
import { Role } from '../../entities/auth/role.entity';
import { City } from '../../entities/shared/city.entity';
import { Region } from '../../entities/shared/region.entity';
import { Country } from '../../entities/shared/country.entity';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
app.use('/api/auth/company', authCompanyRoutes);

describe('Company Registration Integration Test', () => {
    let cityId: string;
    const uniqueId = uuidv4().substring(0, 8);
    const testEmail = `test_company_${uniqueId}@test.com`;
    const testDirectorEmail = `test_director_${uniqueId}@test.com`;
    const testRut = `${Math.floor(Math.random() * 10000000)}-${Math.floor(Math.random() * 9)}`;
    const testDirectorRut = `${Math.floor(Math.random() * 10000000)}-${Math.floor(Math.random() * 9)}`;

    beforeAll(async () => {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        // Setup Country, Region, City for FK constraints
        const countryRepo = AppDataSource.getRepository(Country);
        const regionRepo = AppDataSource.getRepository(Region);
        const cityRepo = AppDataSource.getRepository(City);

        let country = await countryRepo.findOne({ where: { code: 'TEST_CL' } });
        if (!country) {
            country = countryRepo.create({ name: 'Test Chile', code: 'TEST_CL' });
            await countryRepo.save(country);
        }

        let region = await regionRepo.findOne({ where: { code: 'TEST_RM' } });
        if (!region) {
            region = regionRepo.create({ name: 'Test Region', code: 'TEST_RM', countryId: country.id });
            await regionRepo.save(region);
        }

        let city = await cityRepo.findOne({ where: { code: 'TEST_STGO' } });
        if (!city) {
            city = cityRepo.create({ name: 'Test Santiago', code: 'TEST_STGO', regionId: region.id });
            await cityRepo.save(city);
        }
        cityId = city.id;
    });

    afterAll(async () => {
        // Cleanup
        const companyRepo = AppDataSource.getRepository(Company);
        const userRepo = AppDataSource.getRepository(User);

        // Delete test data
        await userRepo.delete({ email: testDirectorEmail });
        await companyRepo.delete({ email: testEmail });

        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    });

    it('should register a company and director successfully', async () => {
        const response = await request(app)
            .post('/api/auth/company/register')
            .send({
                company: {
                    name: 'Test Company',
                    legalName: 'Test Company SpA',
                    rut: testRut,
                    email: testEmail,
                    phone: '+56911111111',
                    address: 'Test Address 123',
                    cityId: cityId
                },
                director: {
                    firstName: 'Test',
                    lastName: 'Director',
                    email: testDirectorEmail,
                    password: 'password123',
                    rut: testDirectorRut,
                    phone: '+56922222222'
                }
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Compañía y director registrados exitosamente');
        expect(response.body.data.company.email).toBe(testEmail);
    });

    it('should fail if email already exists', async () => {
        // Try to register again with same email
        const response = await request(app)
            .post('/api/auth/company/register')
            .send({
                company: {
                    name: 'Test Company 2',
                    legalName: 'Test Company 2 SpA',
                    rut: `${Math.floor(Math.random() * 10000000)}-${Math.floor(Math.random() * 9)}`, // Different RUT
                    email: 'test_company2@test.com',
                    phone: '+56911111111',
                    address: 'Test Address 123',
                    cityId: cityId
                },
                director: {
                    firstName: 'Test',
                    lastName: 'Director',
                    email: testDirectorEmail, // Same director email as before
                    password: 'password123',
                    rut: `${Math.floor(Math.random() * 10000000)}-${Math.floor(Math.random() * 9)}`, // Different RUT
                    phone: '+56922222222'
                }
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Ya existe un usuario con este email');
    });
});
