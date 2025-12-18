import { AppDataSource } from '../config/database';
import { User } from '../entities/auth/user.entity';
import { Company } from '../entities/companies/company.entity';
import { Role } from '../entities/auth/role.entity';
import { UserRole } from '../entities/auth/user-role.entity';
import { City } from '../entities/shared/city.entity';
import { Region } from '../entities/shared/region.entity';
import { Country } from '../entities/shared/country.entity';
import bcrypt from 'bcryptjs';

async function seedDev() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected');

        const companyRepository = AppDataSource.getRepository(Company);
        const userRepository = AppDataSource.getRepository(User);
        const roleRepository = AppDataSource.getRepository(Role);
        const userRoleRepository = AppDataSource.getRepository(UserRole);

        const cityRepository = AppDataSource.getRepository(City);
        const regionRepository = AppDataSource.getRepository(Region);
        const countryRepository = AppDataSource.getRepository(Country);

        // 0. Ensure Location Exists (City/Region/Country)
        let city = await cityRepository.findOne({ where: {} });
        if (!city) {
            console.log('No city found. Creating default location...');
            let country = await countryRepository.findOne({ where: {} });
            if (!country) {
                country = countryRepository.create({ name: 'Chile', code: 'CL' });
                await countryRepository.save(country);
            }
            let region = await regionRepository.findOne({ where: {} });
            if (!region) {
                region = regionRepository.create({ name: 'Región Metropolitana', code: 'RM', countryId: country.id });
                await regionRepository.save(region);
            }
            city = cityRepository.create({ name: 'Santiago', code: 'STGO', regionId: region.id });
            await cityRepository.save(city);
        }

        // 1. Find or Create Company (Semillitas)
        let company = await companyRepository.findOne({ where: { rut: '76.123.456-7' } }); // RUT from seed-company.ts

        if (!company) {
            console.log('Company not found. creating Default Company...');
            // Minimal company just for the user to exist in context
            company = companyRepository.create({
                name: 'Dev Company',
                legalName: 'Dev SpA',
                rut: '99.999.999-9',
                email: 'dev@dev.cl',
                phone: '+56900000000',
                address: 'Calle Falsa 123',
                cityId: city.id,
                isActive: true
            });
            await companyRepository.save(company);
        }

        const companyId = company.id;
        console.log(`Using Company: ${company.name} (${companyId})`);

        // 2. Find or Create SUPERADMIN Role
        let superRole = await roleRepository.findOne({
            where: {
                companyId: companyId,
                code: 'SUPERADMIN'
            }
        });

        if (!superRole) {
            console.log('Creating SUPERADMIN role...');
            superRole = roleRepository.create({
                name: 'Super Admin',
                code: 'SUPERADMIN',
                description: 'Super Administrador (Dev)',
                isSystemRole: true,
                companyId: companyId
            });
            await roleRepository.save(superRole);
        }

        // 3. Create Dev User
        const email = 'dev@dev.cl';
        const password = '123456';
        let user = await userRepository.findOne({ where: { email } });

        if (user) {
            console.log('User dev@dev.cl already exists. Updating password/role...');
            user.passwordHash = await bcrypt.hash(password, 12);
            await userRepository.save(user);
        } else {
            console.log('Creating dev@dev.cl user...');
            user = userRepository.create({
                firstName: 'Dev',
                lastName: 'Superadmin',
                email: email,
                passwordHash: await bcrypt.hash(password, 12),
                companyId: companyId,
                isActive: true,
                emailVerified: true,
                rut: '11.111.111-1',
                phone: '+56900000000'
            });
            await userRepository.save(user);
        }

        // 4. Assign Role
        const hasRole = await userRoleRepository.findOne({
            where: {
                userId: user.id,
                roleId: superRole.id
            }
        });

        if (!hasRole) {
            console.log('Assigning SUPERADMIN role to user...');
            const userRole = userRoleRepository.create({
                userId: user.id,
                roleId: superRole.id,
                companyId: companyId,
                assignedAt: new Date(),
                assignedById: user.id // Self-assigned
            });
            await userRoleRepository.save(userRole);
        } else {
            console.log('User already has SUPERADMIN role.');
        }

        console.log('✅ Seed Dev successful');
        console.log(`User: ${email}`);
        console.log(`Pass: ${password}`);

    } catch (error) {
        console.error('Error seeding dev:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

seedDev();
