# Guía de Estrategia de Aislamiento de Datos

## 📋 Índice
1. [¿Qué es el Aislamiento de Datos?](#qué-es-el-aislamiento-de-datos)
2. [Componentes del Sistema](#componentes-del-sistema)
3. [Cuándo Usar Cada Componente](#cuándo-usar-cada-componente)
4. [Ejemplos Prácticos](#ejemplos-prácticos)
5. [Casos Especiales](#casos-especiales)
6. [Errores Comunes](#errores-comunes)

---

## ¿Qué es el Aislamiento de Datos?

El **aislamiento de datos** (también conocido como **multi-tenancy**) es una estrategia de seguridad que garantiza que los datos de una compañía (jardín infantil) no puedan ser accedidos ni modificados por usuarios de otra compañía.

### ¿Por qué es importante?

Imagina que tienes dos jardines infantiles usando el mismo sistema:
- 🏫 **Jardín "Los Girasoles"** (companyId: `abc-123`)
- 🏫 **Jardín "Las Estrellitas"** (companyId: `xyz-789`)

Sin aislamiento de datos, un usuario del Jardín "Los Girasoles" podría accidentalmente (o intencionalmente) ver o modificar datos de estudiantes del Jardín "Las Estrellitas". **¡Esto es un grave problema de seguridad!**

El aislamiento de datos previene esto automáticamente.

---

## Componentes del Sistema

### 1. 🗂️ Context Management (`src/utils/context.ts`)

**¿Qué hace?**  
Almacena el `companyId` del usuario actual durante toda la duración de una petición HTTP usando `AsyncLocalStorage` de Node.js.

**Funciones principales:**

#### `runWithContext(data, callback)`
Ejecuta código dentro de un contexto específico.

```typescript
import { runWithContext } from '../utils/context';

runWithContext({ companyId: 'abc-123' }, () => {
  // Todo el código aquí "sabe" que está trabajando con companyId 'abc-123'
  console.log(getCompanyId()); // Output: 'abc-123'
});
```

#### `getCompanyId()`
Obtiene el ID de la compañía del contexto actual.

```typescript
import { getCompanyId } from '../utils/context';

const currentCompanyId = getCompanyId();
console.log(currentCompanyId); // 'abc-123' (si está dentro de un contexto)
```

#### `bypassIsolation(callback)`
**⚠️ USAR CON EXTREMA PRECAUCIÓN**  
Desactiva temporalmente el aislamiento de datos. Solo usar en casos muy específicos.

```typescript
import { bypassIsolation } from '../utils/context';

// Esto permitirá acceder a datos de TODAS las compañías
const allStudents = await bypassIsolation(async () => {
  const repo = AppDataSource.getRepository(Student);
  return repo.find(); // Sin filtro de companyId
});
```

---

### 2. 🛡️ Middleware de Contexto (`src/middlewares/company-context.middleware.ts`)

**¿Qué hace?**  
Extrae el `companyId` del usuario autenticado (de `req.user`) y lo almacena en el contexto para toda la petición.

**¿Cuándo se ejecuta?**  
Automáticamente en cada petición HTTP después de la autenticación.

**Flujo:**
```
1. Usuario hace login → JWT contiene userId
2. Middleware de autenticación → Carga user y lo pone en req.user
3. Middleware de contexto → Extrae user.companyId y lo pone en el contexto
4. Resto de la aplicación → Puede usar getCompanyId() para obtener el companyId
```

---

### 3. 🔒 Subscriber de Aislamiento (`src/subscribers/company-isolation.subscriber.ts`)

**¿Qué hace?**  
Intercepta **todas** las operaciones de escritura (INSERT, UPDATE, DELETE) en TypeORM y:

1. **Verifica** que el `companyId` de la entidad coincida con el del contexto
2. **Asigna automáticamente** el `companyId` del contexto si no está establecido
3. **Lanza un error** si intentas modificar datos de otra compañía

**Ejemplo de protección automática:**

```typescript
// Contexto actual: companyId = 'abc-123'

const student = studentRepo.create({
  firstName: 'Juan',
  lastName: 'Pérez',
  // ⚠️ NO especificamos companyId
});

await studentRepo.save(student);
// ✅ El subscriber automáticamente asigna companyId = 'abc-123'
```

**Ejemplo de error de seguridad:**

```typescript
// Contexto actual: companyId = 'abc-123'

const student = studentRepo.create({
  firstName: 'María',
  lastName: 'González',
  companyId: 'xyz-789' // ⚠️ Intentando crear estudiante para otra compañía
});

await studentRepo.save(student);
// ❌ ERROR: "Security Violation: Attempting to access/modify data from another company"
```

---

### 4. 📚 Scoped Repository (`src/utils/scoped-repository.ts`)

**¿Qué hace?**  
Envuelve los repositorios normales de TypeORM para **filtrar automáticamente** todas las consultas por `companyId`.

**¿Cómo usarlo?**

```typescript
import { getScopedRepository } from '../utils/scoped-repository';
import { Student } from '../entities/students/student.entity';

// ❌ NO HACER ESTO (no filtra por companyId)
const unsafeRepo = AppDataSource.getRepository(Student);

// ✅ HACER ESTO (filtra automáticamente por companyId)
const safeRepo = getScopedRepository(Student);
```

**Ejemplo completo:**

```typescript
// Contexto actual: companyId = 'abc-123'

const studentRepo = getScopedRepository(Student);

// Esta consulta automáticamente agrega: WHERE companyId = 'abc-123'
const students = await studentRepo.find();

// También puedes agregar condiciones adicionales
const activeStudents = await studentRepo.find({
  where: { status: 'active' }
  // Internamente se convierte en: WHERE companyId = 'abc-123' AND status = 'active'
});

// Buscar un estudiante específico
const student = await studentRepo.findOne({
  where: { id: 'student-id-123' }
  // Internamente: WHERE companyId = 'abc-123' AND id = 'student-id-123'
});
```

---

## Cuándo Usar Cada Componente

### ✅ Operaciones Normales (99% de los casos)

**Usa `getScopedRepository`** para todas las entidades que tienen `companyId`:

```typescript
// En tus servicios
import { getScopedRepository } from '../utils/scoped-repository';

export class StudentService {
  async getStudents() {
    const repo = getScopedRepository(Student);
    return repo.find(); // Automáticamente filtrado por companyId
  }

  async createStudent(data: CreateStudentDto) {
    const repo = getScopedRepository(Student);
    const student = repo.create(data); // companyId asignado automáticamente
    return repo.save(student);
  }
}
```

### ⚠️ Entidades Sin `companyId`

Algunas entidades son **compartidas** entre todas las compañías (ej: `Country`, `Region`, `City`). Para estas, usa el repositorio normal:

```typescript
import { AppDataSource } from '../config/database';
import { City } from '../entities/locations/city.entity';

// ✅ Correcto - City no tiene companyId
const cityRepo = AppDataSource.getRepository(City);
const cities = await cityRepo.find();
```

### 🚨 Casos Especiales (usar `bypassIsolation`)

**Solo usa `bypassIsolation` en estos casos:**

1. **Registro de nueva compañía** (no hay contexto previo)
2. **Operaciones de super-admin** (acceso a todas las compañías)
3. **Migraciones de datos** (scripts de mantenimiento)

```typescript
import { bypassIsolation } from '../utils/context';

// Ejemplo: Registro de compañía
async registerCompany(data: RegisterCompanyDto) {
  // No hay contexto de compañía porque estamos CREANDO una nueva
  return bypassIsolation(async () => {
    const company = companyRepo.create(data);
    return companyRepo.save(company);
  });
}
```

---

## Ejemplos Prácticos

### Ejemplo 1: Crear un Servicio de Estudiantes

```typescript
// src/services/students/student.service.ts
import { getScopedRepository } from '../../utils/scoped-repository';
import { Student } from '../../entities/students/student.entity';

export class StudentService {
  /**
   * Obtiene todos los estudiantes de la compañía actual
   */
  async getAllStudents() {
    const studentRepo = getScopedRepository(Student);
    
    // Automáticamente filtra por companyId del contexto
    return studentRepo.find({
      relations: ['classroom', 'guardians']
    });
  }

  /**
   * Crea un nuevo estudiante
   */
  async createStudent(data: CreateStudentDto) {
    const studentRepo = getScopedRepository(Student);
    
    // El companyId se asigna automáticamente del contexto
    const student = studentRepo.create(data);
    
    return studentRepo.save(student);
  }

  /**
   * Busca un estudiante por ID
   */
  async getStudentById(id: string) {
    const studentRepo = getScopedRepository(Student);
    
    // Solo encontrará el estudiante si pertenece a la compañía actual
    const student = await studentRepo.findOne({
      where: { id },
      relations: ['classroom', 'guardians']
    });

    if (!student) {
      throw new Error('Estudiante no encontrado');
    }

    return student;
  }

  /**
   * Actualiza un estudiante
   */
  async updateStudent(id: string, data: UpdateStudentDto) {
    const studentRepo = getScopedRepository(Student);
    
    // Primero busca (con filtro de companyId)
    const student = await studentRepo.findOne({ where: { id } });
    
    if (!student) {
      throw new Error('Estudiante no encontrado');
    }

    // Actualiza los datos
    Object.assign(student, data);
    
    // El subscriber verifica que no cambies el companyId
    return studentRepo.save(student);
  }
}
```

### Ejemplo 2: Controlador con Middleware

```typescript
// src/routes/students.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { companyContextMiddleware } from '../middlewares/company-context.middleware';
import { studentController } from '../controllers/student.controller';

const router = Router();

// 1. Primero autenticación (carga req.user)
// 2. Luego contexto de compañía (extrae companyId de req.user)
router.use(authMiddleware);
router.use(companyContextMiddleware);

// Ahora todas las rutas tienen el contexto de compañía
router.get('/', studentController.getAll);
router.post('/', studentController.create);
router.get('/:id', studentController.getById);
router.put('/:id', studentController.update);
router.delete('/:id', studentController.delete);

export default router;
```

---

## Casos Especiales

### Caso 1: Registro de Compañía

**Problema:** Al registrar una nueva compañía, no existe un contexto previo de `companyId`.

**Solución:** Usar `bypassIsolation`

```typescript
// src/services/auth/auth-company.service.ts
import { bypassIsolation } from '../../utils/context';

export class AuthCompanyService {
  async registerCompany(data: RegisterCompanyDto) {
    // Bypass necesario porque estamos CREANDO la compañía
    return bypassIsolation(async () => {
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // 1. Crear compañía
        const company = companyRepo.create(data.company);
        const savedCompany = await queryRunner.manager.save(company);

        // 2. Crear roles del sistema para esta compañía
        await this.createCompanyRoles(savedCompany.id, queryRunner.manager);

        // 3. Crear usuario director
        const director = userRepo.create({
          ...data.director,
          companyId: savedCompany.id // Asignamos explícitamente
        });
        const savedDirector = await queryRunner.manager.save(director);

        await queryRunner.commitTransaction();
        return { company: savedCompany, director: savedDirector };
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    });
  }
}
```

### Caso 2: Reportes de Super-Admin

**Problema:** Un super-admin necesita ver estadísticas de todas las compañías.

**Solución:** Usar `bypassIsolation` con verificación de permisos

```typescript
export class ReportService {
  async getAllCompaniesReport(userId: string) {
    // Primero verificar que el usuario es super-admin
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user.isSuperAdmin) {
      throw new Error('Acceso denegado');
    }

    // Ahora sí, bypass para obtener datos de todas las compañías
    return bypassIsolation(async () => {
      const companies = await companyRepo.find({
        relations: ['students', 'users']
      });

      return companies.map(company => ({
        name: company.name,
        studentCount: company.students.length,
        userCount: company.users.length
      }));
    });
  }
}
```

### Caso 3: Query Builder Personalizado

**Problema:** Necesitas usar `createQueryBuilder` para consultas complejas.

**Solución:** Agregar manualmente el filtro de `companyId`

```typescript
import { getCompanyId } from '../../utils/context';

export class StudentService {
  async getStudentsWithComplexQuery() {
    const companyId = getCompanyId();
    
    if (!companyId) {
      throw new Error('No hay contexto de compañía');
    }

    return AppDataSource
      .getRepository(Student)
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.classroom', 'classroom')
      .leftJoinAndSelect('student.guardians', 'guardians')
      .where('student.companyId = :companyId', { companyId }) // ⚠️ IMPORTANTE
      .andWhere('student.status = :status', { status: 'active' })
      .orderBy('student.lastName', 'ASC')
      .getMany();
  }
}
```

---

## Errores Comunes

### ❌ Error 1: Usar repositorio normal en lugar de scoped

```typescript
// ❌ MAL - No filtra por companyId
const studentRepo = AppDataSource.getRepository(Student);
const students = await studentRepo.find();
// Esto devuelve estudiantes de TODAS las compañías

// ✅ BIEN - Filtra automáticamente
const studentRepo = getScopedRepository(Student);
const students = await studentRepo.find();
// Esto devuelve solo estudiantes de la compañía actual
```

### ❌ Error 2: Olvidar el middleware de contexto

```typescript
// ❌ MAL - Sin middleware de contexto
router.use(authMiddleware);
router.get('/students', studentController.getAll);
// getCompanyId() devolverá undefined

// ✅ BIEN - Con middleware de contexto
router.use(authMiddleware);
router.use(companyContextMiddleware); // Esto establece el contexto
router.get('/students', studentController.getAll);
```

### ❌ Error 3: Usar bypassIsolation innecesariamente

```typescript
// ❌ MAL - Bypass innecesario
async getStudents() {
  return bypassIsolation(async () => {
    const repo = AppDataSource.getRepository(Student);
    return repo.find();
  });
}
// Esto devuelve estudiantes de TODAS las compañías (problema de seguridad)

// ✅ BIEN - Usar scoped repository
async getStudents() {
  const repo = getScopedRepository(Student);
  return repo.find();
}
// Esto devuelve solo estudiantes de la compañía actual
```

### ❌ Error 4: Intentar cambiar el companyId manualmente

```typescript
// ❌ MAL - Intentar cambiar companyId
const student = await studentRepo.findOne({ where: { id } });
student.companyId = 'otra-compania-id'; // ⚠️ Esto lanzará un error
await studentRepo.save(student);
// Error: "Security Violation: Attempting to access/modify data from another company"

// ✅ BIEN - No tocar el companyId
const student = await studentRepo.findOne({ where: { id } });
student.firstName = 'Nuevo Nombre'; // Solo modificar otros campos
await studentRepo.save(student);
```

---

## Checklist de Implementación

Cuando crees una nueva funcionalidad, verifica:

- [ ] ¿La entidad tiene `companyId`?
  - ✅ Sí → Usar `getScopedRepository`
  - ❌ No → Usar repositorio normal
- [ ] ¿Estás usando `createQueryBuilder`?
  - ✅ Sí → Agregar manualmente `.where('entity.companyId = :companyId', { companyId })`
- [ ] ¿Es una operación de super-admin o registro inicial?
  - ✅ Sí → Usar `bypassIsolation` con verificación de permisos
  - ❌ No → NO usar `bypassIsolation`
- [ ] ¿Tus rutas tienen los middlewares correctos?
  - [ ] `authMiddleware` (primero)
  - [ ] `companyContextMiddleware` (segundo)

---

## Resumen

| Componente | Cuándo Usar | Ejemplo |
|------------|-------------|---------|
| `getScopedRepository` | Operaciones normales con entidades que tienen `companyId` | `getScopedRepository(Student)` |
| `AppDataSource.getRepository` | Entidades sin `companyId` (compartidas) | `AppDataSource.getRepository(City)` |
| `bypassIsolation` | Registro de compañía, super-admin, migraciones | `bypassIsolation(() => ...)` |
| `getCompanyId` | Obtener companyId en query builders personalizados | `.where('companyId = :id', { id: getCompanyId() })` |
| Subscriber | Automático - protege escrituras | No requiere código |
| Middleware | Automático - establece contexto en cada request | Agregar a rutas protegidas |

---

**🎯 Regla de Oro:** Si la entidad tiene `companyId`, **SIEMPRE** usa `getScopedRepository`. Solo usa `bypassIsolation` cuando sea absolutamente necesario y con extrema precaución.
