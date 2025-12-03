// src/services/auth-company.service.ts
import { AppDataSource } from '../../config/database';
import { Role } from '../../entities/auth/role.entity';
import { UserRole } from '../../entities/auth/user-role.entity';
import { User } from '../../entities/auth/user.entity';
import { Company } from '../../entities/companies/company.entity';
import bcrypt from 'bcryptjs';
import { IRegisterCompanyData, IRegisterCompanyResult } from '../../interfaces/auth/auth-company.interface';
import { registerCompanySchema } from '../../schemas/auth/auth-company.schema';
import { EntityManager } from 'typeorm';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ESTRATEGIA DE AISLAMIENTO DE DATOS - EJEMPLO DE USO
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Este servicio demuestra cómo utilizar la estrategia de aislamiento de datos
 * implementada en el sistema.
 * 
 * 📚 Para más información, consulta: docs/GUIA_AISLAMIENTO_DATOS.md
 * 
 * COMPONENTES CLAVE:
 * ------------------
 * 1. bypassIsolation() - Desactiva temporalmente el aislamiento
 * 2. getScopedRepository() - Repositorio que filtra automáticamente por companyId
 * 3. CompanyIsolationSubscriber - Protege escrituras automáticamente
 * 4. companyContextMiddleware - Establece el contexto en cada request
 * 
 * CUÁNDO USAR bypassIsolation:
 * -----------------------------
 * ✅ Registro de nueva compañía (no hay contexto previo)
 * ✅ Operaciones de super-admin (acceso a todas las compañías)
 * ✅ Migraciones de datos
 * ❌ Operaciones normales de usuarios (usar getScopedRepository en su lugar)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { bypassIsolation } from '../../utils/context';

// Repositories
// NOTA: Estos repositorios NO están protegidos por aislamiento automático.
// Para operaciones normales, usa getScopedRepository() en su lugar.
// Aquí los usamos porque el registro de compañía requiere bypassIsolation.
const userRepository = AppDataSource.getRepository(User);
const companyRepository = AppDataSource.getRepository(Company);
const roleRepository = AppDataSource.getRepository(Role);
const userRoleRepository = AppDataSource.getRepository(UserRole);

export const authCompanyService = {
  /**
   * Registro completo de compañía + director
   * 
   * ⚠️ CASO ESPECIAL DE AISLAMIENTO:
   * Este es un caso donde DEBEMOS usar bypassIsolation porque:
   * 1. Estamos CREANDO una nueva compañía (no existe contexto previo)
   * 2. No hay un usuario autenticado con companyId
   * 3. Necesitamos crear entidades para una compañía que aún no existe en el contexto
   * 
   * El subscriber de aislamiento normalmente requiere que el companyId del contexto
   * coincida con el de la entidad. Como no hay contexto aquí, debemos bypasearlo.
   */
  async registerCompany(data: IRegisterCompanyData): Promise<IRegisterCompanyResult> {
    // Validar datos con Zod
    const validatedData = registerCompanySchema.parse(data);

    /**
     * 🔓 BYPASS DE AISLAMIENTO
     * 
     * Usamos bypassIsolation aquí porque:
     * - No existe un contexto de compañía (estamos creando la primera compañía)
     * - El subscriber de aislamiento lanzaría un error sin este bypass
     * - Es seguro porque estamos creando datos nuevos, no accediendo a datos existentes
     */
    return bypassIsolation(async () => {
      // Iniciar transacción
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Verificar si el usuario ya existe
        const existingUser = await userRepository.findOne({
          where: { email: validatedData.director.email }
        });

        if (existingUser) {
          throw new Error('Ya existe un usuario con este email');
        }

        // Verificar si la compañía ya existe (por RUT o email)
        const existingCompany = await companyRepository.findOne({
          where: [
            { rut: validatedData.company.rut },
            { email: validatedData.company.email }
          ]
        });

        if (existingCompany) {
          throw new Error('Ya existe una compañía con este RUT o email');
        }

        // 1. Crear la compañía
        const company = companyRepository.create({
          ...validatedData.company,
          isActive: true,
        });

        const savedCompany = await queryRunner.manager.save(company);

        // 2. Crear roles del sistema para esta compañía
        // NOTA: Asignamos explícitamente el companyId porque estamos en bypass
        await this.createCompanyRoles(savedCompany.id, queryRunner.manager);

        // 3. Hashear contraseña y crear usuario director
        const hashedPassword = await bcrypt.hash(validatedData.director.password, 12);

        const director = userRepository.create({
          ...validatedData.director,
          passwordHash: hashedPassword,
          companyId: savedCompany.id, // ⚠️ Asignación explícita necesaria en bypass
          isActive: true,
          emailVerified: false,
        });

        const savedDirector = await queryRunner.manager.save(director);

        // 4. Buscar el rol de Director recién creado
        const directorRole = await queryRunner.manager.findOne(Role, {
          where: {
            companyId: savedCompany.id,
            code: 'DIRECTOR'
          }
        });

        if (!directorRole) {
          throw new Error('Error interno: Rol de director no encontrado');
        }

        // 5. Asignar rol de Director al usuario
        const userRole = userRoleRepository.create({
          companyId: savedCompany.id,
          userId: savedDirector.id,
          roleId: directorRole.id,
          assignedAt: new Date(),
          assignedById: savedDirector.id, // Se auto-asigna
        });

        await queryRunner.manager.save(userRole);

        // Confirmar transacción
        await queryRunner.commitTransaction();

        return {
          company: {
            name: savedCompany.name,
            email: savedCompany.email,
            rut: savedCompany.rut,
            cityId: savedCompany.cityId
          },
          user: {
            firstName: savedDirector.firstName,
            lastName: savedDirector.lastName,
            email: savedDirector.email,
          },
          message: 'Compañía y director registrados exitosamente'
        };

      } catch (error) {
        // Revertir transacción en caso de error
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        // Liberar query runner
        await queryRunner.release();
      }
    }); // Fin de bypassIsolation
  },

  /**
   * Crear roles del sistema para una compañía
   * 
   * NOTA: Esta función se ejecuta dentro de bypassIsolation,
   * por lo que debemos asignar explícitamente el companyId.
   */
  async createCompanyRoles(companyId: string, manager: EntityManager): Promise<void> {
    const systemRoles = [
      { name: 'Director', code: 'DIRECTOR', description: 'Director de la institución' },
      { name: 'Administrador', code: 'ADMIN', description: 'Administrador del sistema' },
      { name: 'Profesor', code: 'TEACHER', description: 'Profesor de aula' },
      { name: 'Apoderado', code: 'GUARDIAN', description: 'Apoderado de estudiante' },
      { name: 'Conductor', code: 'DRIVER', description: 'Conductor de transporte' },
    ];

    for (const roleData of systemRoles) {
      const role = roleRepository.create({
        ...roleData,
        companyId, // ⚠️ Asignación explícita del companyId
        isSystemRole: true,
      });
      await manager.save(role);
    }
  },

  /**
   * Verificar si email ya está registrado
   * 
   * 📝 EJEMPLO DE OPERACIÓN SIN AISLAMIENTO:
   * Esta función NO usa getScopedRepository porque queremos verificar
   * si el email existe en CUALQUIER compañía (no solo la actual).
   * Esto es correcto para el registro porque un email debe ser único globalmente.
   */
  async checkEmailExists(email: string): Promise<boolean> {
    const user = await userRepository.findOne({ where: { email } });
    return !!user;
  },

  /**
   * Verificar si RUT de compañía ya existe
   * 
   * 📝 EJEMPLO DE OPERACIÓN SIN AISLAMIENTO:
   * Similar a checkEmailExists, queremos verificar si el RUT existe
   * en CUALQUIER compañía (no solo la actual).
   */
  async checkCompanyRutExists(rut: string): Promise<boolean> {
    const company = await companyRepository.findOne({ where: { rut } });
    return !!company;
  }
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EJEMPLO DE CÓMO USAR getScopedRepository EN OPERACIONES NORMALES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Para operaciones normales (no registro), usa getScopedRepository:
 * 
 * import { getScopedRepository } from '../../utils/scoped-repository';
 * import { Student } from '../../entities/students/student.entity';
 * 
 * export const studentService = {
 *   async getAllStudents() {
 *     // ✅ Esto filtra automáticamente por companyId del contexto
 *     const studentRepo = getScopedRepository(Student);
 *     return studentRepo.find();
 *   },
 * 
 *   async createStudent(data: CreateStudentDto) {
 *     // ✅ El companyId se asigna automáticamente del contexto
 *     const studentRepo = getScopedRepository(Student);
 *     const student = studentRepo.create(data);
 *     return studentRepo.save(student);
 *   },
 * 
 *   async getStudentById(id: string) {
 *     // ✅ Solo encuentra el estudiante si pertenece a la compañía actual
 *     const studentRepo = getScopedRepository(Student);
 *     return studentRepo.findOne({ where: { id } });
 *   }
 * };
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */