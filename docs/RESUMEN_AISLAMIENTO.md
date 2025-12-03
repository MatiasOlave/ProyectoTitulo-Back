# Resumen Rápido: Estrategia de Aislamiento de Datos

## 🎯 ¿Qué es?

Un sistema que garantiza que los datos de una compañía (jardín) no puedan ser accedidos por otra compañía.

---

## 🔑 4 Componentes Principales

### 1. **Context** (`src/utils/context.ts`)
Almacena el `companyId` del usuario actual durante toda la request.

```typescript
import { getCompanyId, bypassIsolation } from '../utils/context';

// Obtener companyId actual
const companyId = getCompanyId();

// Desactivar aislamiento (casos especiales)
bypassIsolation(async () => {
  // Código sin restricciones de aislamiento
});
```

### 2. **Middleware** (`src/middlewares/company-context.middleware.ts`)
Extrae el `companyId` del usuario autenticado.

```typescript
// En tus rutas
router.use(authMiddleware); // 1. Autenticación
router.use(companyContextMiddleware); // 2. Contexto
```

### 3. **Subscriber** (`src/subscribers/company-isolation.subscriber.ts`)
Protege automáticamente las **escrituras** (INSERT, UPDATE, DELETE).

- ✅ Asigna `companyId` automáticamente
- ❌ Bloquea si intentas modificar datos de otra compañía

### 4. **Scoped Repository** (`src/utils/scoped-repository.ts`)
Filtra automáticamente las **lecturas** por `companyId`.

```typescript
import { getScopedRepository } from '../utils/scoped-repository';

const studentRepo = getScopedRepository(Student);
const students = await studentRepo.find(); // Solo de tu compañía
```

---

## 📝 Cuándo Usar Cada Uno

| Situación | Usar | Ejemplo |
|-----------|------|---------|
| **Operaciones normales** | `getScopedRepository()` | Listar estudiantes, crear profesor |
| **Registro de compañía** | `bypassIsolation()` | Crear nueva compañía + director |
| **Super-admin** | `bypassIsolation()` | Ver todas las compañías |
| **Entidades compartidas** | `AppDataSource.getRepository()` | Ciudades, regiones, países |

---

## ✅ Ejemplo: Operación Normal

```typescript
// ✅ CORRECTO - Usa getScopedRepository
import { getScopedRepository } from '../utils/scoped-repository';

export const studentService = {
  async getAllStudents() {
    const repo = getScopedRepository(Student);
    return repo.find(); // Automáticamente filtrado
  },

  async createStudent(data: CreateStudentDto) {
    const repo = getScopedRepository(Student);
    const student = repo.create(data); // companyId asignado automáticamente
    return repo.save(student);
  }
};
```

---

## ⚠️ Ejemplo: Caso Especial (Registro)

```typescript
// ⚠️ CASO ESPECIAL - Usa bypassIsolation
import { bypassIsolation } from '../utils/context';

export const authService = {
  async registerCompany(data: RegisterDto) {
    // No hay contexto de compañía porque la estamos CREANDO
    return bypassIsolation(async () => {
      const company = companyRepo.create(data.company);
      const savedCompany = await companyRepo.save(company);

      const director = userRepo.create({
        ...data.director,
        companyId: savedCompany.id // ⚠️ Asignación EXPLÍCITA necesaria
      });
      await userRepo.save(director);

      return { company: savedCompany, director };
    });
  }
};
```

---

## 🚫 Errores Comunes

### ❌ Error 1: No usar getScopedRepository

```typescript
// ❌ MAL - Devuelve datos de TODAS las compañías
const repo = AppDataSource.getRepository(Student);
const students = await repo.find();

// ✅ BIEN - Solo datos de la compañía actual
const repo = getScopedRepository(Student);
const students = await repo.find();
```

### ❌ Error 2: Usar bypassIsolation innecesariamente

```typescript
// ❌ MAL - Bypass innecesario (problema de seguridad)
async getStudents() {
  return bypassIsolation(async () => {
    const repo = AppDataSource.getRepository(Student);
    return repo.find(); // Devuelve de TODAS las compañías
  });
}

// ✅ BIEN - Usa scoped repository
async getStudents() {
  const repo = getScopedRepository(Student);
  return repo.find(); // Solo de la compañía actual
}
```

### ❌ Error 3: Olvidar asignar companyId en bypass

```typescript
// ❌ MAL - companyId será undefined
return bypassIsolation(async () => {
  const user = userRepo.create(data);
  // companyId no se asigna automáticamente en bypass
  await userRepo.save(user);
});

// ✅ BIEN - Asignación explícita
return bypassIsolation(async () => {
  const user = userRepo.create({
    ...data,
    companyId: company.id // Explícito
  });
  await userRepo.save(user);
});
```

---

## 🎯 Regla de Oro

> **Si la entidad tiene `companyId`, SIEMPRE usa `getScopedRepository`**
> 
> Solo usa `bypassIsolation` cuando sea absolutamente necesario:
> - ✅ Registro de compañía
> - ✅ Super-admin
> - ✅ Migraciones
> - ❌ Operaciones normales

---

## 📚 Documentación Completa

Para más detalles, consulta:

- 📘 [GUIA_AISLAMIENTO_DATOS.md](file:///c:/Users/nacho/OneDrive/Escritorio/Programacion/proyecto_titulo/backend-express/docs/GUIA_AISLAMIENTO_DATOS.md) - Guía completa en español
- 💻 [auth-company.service.ts](file:///c:/Users/nacho/OneDrive/Escritorio/Programacion/proyecto_titulo/backend-express/src/services/auth/auth-company.service.ts) - Ejemplo de código con comentarios
- 📄 [DATA_ISOLATION.md](file:///c:/Users/nacho/OneDrive/Escritorio/Programacion/proyecto_titulo/backend-express/docs/DATA_ISOLATION.md) - Documentación técnica original

---

## 🔄 Flujo Completo

```
1. Usuario hace request
   ↓
2. authMiddleware → Carga user en req.user
   ↓
3. companyContextMiddleware → Extrae companyId y lo pone en contexto
   ↓
4. Tu código usa getScopedRepository
   ↓
5. Subscriber verifica escrituras
   ↓
6. ScopedRepository filtra lecturas
   ↓
7. Solo datos de la compañía del usuario
```

---

## ✅ Checklist para Nuevas Funcionalidades

- [ ] ¿La entidad tiene `companyId`?
  - ✅ Sí → Usar `getScopedRepository`
  - ❌ No → Usar `AppDataSource.getRepository`
- [ ] ¿Tus rutas tienen los middlewares?
  - [ ] `authMiddleware`
  - [ ] `companyContextMiddleware`
- [ ] ¿Usas `createQueryBuilder`?
  - [ ] Agregar `.where('entity.companyId = :companyId', { companyId })`
- [ ] ¿Es super-admin o registro inicial?
  - [ ] Usar `bypassIsolation` con verificación de permisos
