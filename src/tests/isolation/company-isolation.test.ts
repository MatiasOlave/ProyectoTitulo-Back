import { AppDataSource } from '../../config/database';
import { User } from '../../entities/auth/user.entity';
import { Company } from '../../entities/companies/company.entity';
import { Student } from '../../entities/students/student.entity';
import { getScopedRepository } from '../../utils/scoped-repository';
import { runWithContext, bypassIsolation } from '../../utils/context';
import { City } from '../../entities/shared/city.entity';
import { Region } from '../../entities/shared/region.entity';
import { Country } from '../../entities/shared/country.entity';

describe('Company Isolation Integration Test', () => {
    let company1: Company;
    let company2: Company;
    let user1: User;
    let user2: User;
    let cityId: string;

    beforeAll(async () => {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        // Setup test data
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

        // Create companies and users without context (bypass)
        await bypassIsolation(async () => {
            const companyRepo = AppDataSource.getRepository(Company);
            const userRepo = AppDataSource.getRepository(User);

            company1 = companyRepo.create({
                name: 'Test Company 1',
                legalName: 'Test Company 1 SpA',
                rut: `${Math.floor(Math.random() * 10000000)}-1`,
                email: `company1_${Date.now()}@test.com`,
                cityId: cityId,
                isActive: true
            });
            await companyRepo.save(company1);

            company2 = companyRepo.create({
                name: 'Test Company 2',
                legalName: 'Test Company 2 SpA',
                rut: `${Math.floor(Math.random() * 10000000)}-2`,
                email: `company2_${Date.now()}@test.com`,
                cityId: cityId,
                isActive: true
            });
            await companyRepo.save(company2);

            user1 = userRepo.create({
                email: `user1_${Date.now()}@test.com`,
                passwordHash: 'hash',
                firstName: 'User',
                lastName: 'One',
                rut: '11111111-1',
                phone: '+56911111111',
                companyId: company1.id,
                isActive: true,
                emailVerified: false
            });
            await userRepo.save(user1);

            user2 = userRepo.create({
                email: `user2_${Date.now()}@test.com`,
                passwordHash: 'hash',
                firstName: 'User',
                lastName: 'Two',
                rut: '22222222-2',
                phone: '+56922222222',
                companyId: company2.id,
                isActive: true,
                emailVerified: false
            });
            await userRepo.save(user2);
        });
    });

    afterAll(async () => {
        // Cleanup
        await bypassIsolation(async () => {
            const userRepo = AppDataSource.getRepository(User);
            const companyRepo = AppDataSource.getRepository(Company);

            await userRepo.delete({ id: user1.id });
            await userRepo.delete({ id: user2.id });
            await companyRepo.delete({ id: company1.id });
            await companyRepo.delete({ id: company2.id });
        });

        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    });

    it('should only fetch users from the same company', async () => {
        await runWithContext({ companyId: company1.id }, async () => {
            const userRepo = getScopedRepository(User);
            const users = await userRepo.find();

            expect(users.length).toBeGreaterThan(0);
            users.forEach(user => {
                expect(user.companyId).toBe(company1.id);
            });
        });
    });

    it('should not fetch users from another company', async () => {
        await runWithContext({ companyId: company1.id }, async () => {
            const userRepo = getScopedRepository(User);
            const users = await userRepo.find();

            const hasUser2 = users.some(u => u.id === user2.id);
            expect(hasUser2).toBe(false);
        });
    });

    it('should automatically set companyId when creating entities', async () => {
        await runWithContext({ companyId: company1.id }, async () => {
            const studentRepo = getScopedRepository(Student);

            const student = studentRepo.create({
                firstName: 'Test',
                lastName: 'Student',
                rut: '33333333-3',
                birthDate: new Date('2020-01-01'),
                gender: 'M',
                photoUrl: 'http://example.com/photo.jpg',
                address: 'Test Address',
                enrollmentDate: new Date(),
                status: 'active',
                cityId: cityId
            });

            await studentRepo.save(student);

            expect(student.companyId).toBe(company1.id);

            // Cleanup
            await bypassIsolation(async () => {
                const repo = AppDataSource.getRepository(Student);
                await repo.delete({ id: student.id });
            });
        });
    });

    it('should throw error when trying to save entity with wrong companyId', async () => {
        await runWithContext({ companyId: company1.id }, async () => {
            const studentRepo = AppDataSource.getRepository(Student);

            const student = studentRepo.create({
                firstName: 'Test',
                lastName: 'Student',
                rut: '44444444-4',
                birthDate: new Date('2020-01-01'),
                gender: 'M',
                photoUrl: 'http://example.com/photo.jpg',
                address: 'Test Address',
                enrollmentDate: new Date(),
                status: 'active',
                cityId: cityId,
                companyId: company2.id // Wrong company!
            });

            await expect(studentRepo.save(student)).rejects.toThrow('Security Violation');
        });
    });
});
