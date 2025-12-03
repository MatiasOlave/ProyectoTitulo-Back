# Data Isolation Strategy - Documentation

## Overview
This system implements a **multi-tenant data isolation strategy** to ensure that users from one company cannot access data from another company.

## Components

### 1. Context Management (`src/utils/context.ts`)
Uses Node.js `AsyncLocalStorage` to store the current user's `companyId` for each request.

**Key Functions:**
- `runWithContext(data, callback)`: Runs code within a context
- `getCompanyId()`: Gets the current company ID
- `setCompanyId(companyId)`: Sets the company ID
- `isIsolationBypassed()`: Checks if isolation is bypassed
- `bypassIsolation(callback)`: Temporarily bypasses isolation (use with extreme caution!)

### 2. Middleware (`src/middlewares/company-context.middleware.ts`)
Extracts `companyId` from the authenticated user and stores it in the context.

**Important:** This middleware assumes `req.user` is populated by an authentication middleware. Make sure to apply authentication middleware BEFORE this one.

### 3. Write Protection (`src/subscribers/company-isolation.subscriber.ts`)
A TypeORM subscriber that enforces company isolation on **INSERT, UPDATE, and DELETE** operations.

**How it works:**
- Before any write operation, it checks if the entity has a `companyId` field
- If the entity's `companyId` doesn't match the context's `companyId`, it throws an error
- If the entity doesn't have a `companyId` set, it automatically sets it to the context's `companyId`

**Security:** This prevents accidentally writing data to the wrong company.

### 4. Read Protection (`src/utils/scoped-repository.ts`)
A helper class that wraps TypeORM repositories to automatically filter queries by `companyId`.

**How to use:**
```typescript
import { getScopedRepository } from '../utils/scoped-repository';
import { Student } from '../entities/students/student.entity';

// In your service or controller
const studentRepo = getScopedRepository(Student);

// This will automatically add WHERE companyId = '...'
const students = await studentRepo.find();

// You can still add other conditions
const activeStudents = await studentRepo.find({
  where: { status: 'active' }
});
```

**Important:** Always use `getScopedRepository` instead of `AppDataSource.getRepository` for entities that have `companyId`.

## Usage Guidelines

### For New Features

1. **Always use `getScopedRepository`** for entities with `companyId`:
```typescript
// ❌ DON'T DO THIS
const repo = AppDataSource.getRepository(Student);

// ✅ DO THIS
const repo = getScopedRepository(Student);
```

2. **The subscriber will protect writes automatically**, but you should still be mindful:
```typescript
// This is safe - companyId will be set automatically
const student = repo.create({
  firstName: 'John',
  lastName: 'Doe',
  // companyId will be added automatically
});
await repo.save(student);
```

3. **If you need to bypass isolation** (e.g., for super admin features):
```typescript
import { bypassIsolation } from '../utils/context';

// Use with EXTREME caution
const allStudents = await bypassIsolation(async () => {
  const repo = AppDataSource.getRepository(Student);
  return repo.find();
});
```

### Entities Without `companyId`

Some entities don't have `companyId` (e.g., `Country`, `Region`, `City`). These are shared across all companies and don't need scoping.

For these, you can use the regular repository:
```typescript
const cityRepo = AppDataSource.getRepository(City);
const cities = await cityRepo.find();
```

## Testing

When writing tests, you need to set up the context:
```typescript
import { runWithContext } from '../utils/context';

it('should only fetch students from the same company', async () => {
  await runWithContext({ companyId: 'company-1-id' }, async () => {
    const repo = getScopedRepository(Student);
    const students = await repo.find();
    // All students will belong to company-1-id
  });
});
```

## Security Guarantees

✅ **Write Protection**: The subscriber prevents writing data to another company
✅ **Read Protection**: `ScopedRepository` prevents reading data from another company
⚠️ **Manual Queries**: If you use raw SQL or `createQueryBuilder`, you MUST manually add the `companyId` filter

## Migration Checklist

When creating new entities:
- [ ] Add `companyId` column if the entity belongs to a company
- [ ] Add `@ManyToOne` relation to `Company`
- [ ] Use `getScopedRepository` in services
- [ ] Test isolation in integration tests
