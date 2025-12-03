import { EntitySubscriberInterface, EventSubscriber, LoadEvent, SelectQueryBuilder } from 'typeorm';
import { getCompanyId, isIsolationBypassed } from '../utils/context';

@EventSubscriber()
export class CompanyIsolationSubscriber implements EntitySubscriberInterface {

    /**
     * Called before entity is loaded.
     */
    afterLoad(entity: any) {
        // We don't need to do anything after load usually, 
        // unless we want to strip fields, but isolation is about fetching.
    }

    /**
     * This method is called before query execution.
     * However, TypeORM subscribers for 'beforeFind' are limited.
     * The most reliable way to intercept SELECT queries globally is actually not via simple subscriber hooks 
     * because `beforeFind` doesn't give easy access to the query builder in all versions or contexts.
     * 
     * BUT, for TypeORM 0.3+, we can use `beforeFind` if we are careful, 
     * OR we rely on the fact that we want to filter ANY query.
     * 
     * Actually, a better approach for "Global Scope" in TypeORM is often using a base repository or 
     * modifying the query builder.
     * 
     * However, let's try to use the `SelectQueryBuilder` interception if possible, 
     * or simply use the `beforeFind` event if it allows modifying the criteria.
     * 
     * In TypeORM, `beforeFind` receives `LoadEvent`.
     * `LoadEvent` has `entity`, `metadata`, etc.
     * 
     * Wait, `beforeFind` is NOT a standard event in `EntitySubscriberInterface` for all versions.
     * Let's check the available methods.
     * `afterLoad`, `beforeInsert`, `afterInsert`, `beforeUpdate`, `afterUpdate`, `beforeRemove`, `afterRemove`, `beforeSoftRemove`, `afterSoftRemove`, `beforeRecover`, `afterRecover`.
     * 
     * THERE IS NO `beforeFind` in standard `EntitySubscriberInterface`!
     * 
     * This is a common misconception. To implement global scopes in TypeORM, 
     * we usually need to use a custom BaseEntity or a custom Repository, 
     * OR patch `SelectQueryBuilder`.
     * 
     * HOWEVER, we can use `afterLoad` to check if the loaded entity belongs to the company, 
     * but that's inefficient (fetches then checks).
     * 
     * A common workaround is to use a global "Scope" mechanism if the library supports it.
     * TypeORM doesn't have built-in global scopes like Eloquent.
     * 
     * ALTERNATIVE STRATEGY:
     * Since `beforeFind` doesn't exist, we might need to rely on:
     * 1. Explicit service usage (as I thought initially).
     * 2. Or extending `SelectQueryBuilder`.
     * 
     * BUT, wait. There IS a way to hook into query building?
     * 
     * Let's look at `DataSource.entityMetadatas`.
     * 
     * Actually, maybe I should pivot to a safer, more explicit strategy if `beforeFind` is not available.
     * 
     * WAIT! I can use `beforeQuery`? No.
     * 
     * Let's check if I can use a Middleware for TypeORM? No.
     * 
     * Okay, if I cannot use a subscriber for `SELECT`, I must use a **BaseRepository** or **Service Layer** enforcement.
     * 
     * However, the user asked for a "strategy".
     * 
     * Let's try to find if there's a way to intercept finds.
     * Some people use `@BeforeInsert` etc.
     * 
     * Actually, let's look at `SelectQueryBuilder`.
     * 
     * If I cannot do it automatically via subscriber for SELECT, 
     * I will implement a `createProtectedQueryBuilder` helper and enforce its usage.
     * 
     * OR, I can use a library like `typeorm-extension` which adds scopes.
     * 
     * BUT, I should stick to vanilla TypeORM if possible.
     * 
     * Let's re-read TypeORM docs in my head.
     * 
     * Ah, `entity-subscriber-interface` indeed does NOT have `beforeFind`.
     * 
     * So, the "Subscriber" plan for *reading* data is flawed for TypeORM.
     * It works for *writing* (beforeInsert/Update) to ensure you don't save data for another company.
     * 
     * I will implement `beforeInsert` and `beforeUpdate` to ENFORCE that `companyId` matches the context.
     * This prevents *writing* data to the wrong company.
     * 
     * For *reading*, I will implement a Helper/Service pattern.
     * 
     * "Si generas funciones... explícalo".
     * 
     * I will create a `ScopedRepository` helper.
     */

    /**
     * Enforce company isolation on WRITE.
     */
    async beforeInsert(event: any) {
        this.enforceCompanyId(event.entity);
    }

    async beforeUpdate(event: any) {
        this.enforceCompanyId(event.entity);
    }

    async beforeRemove(event: any) {
        this.enforceCompanyId(event.entity);
    }

    private enforceCompanyId(entity: any) {
        if (!entity) return;

        // Check if entity has companyId property
        if (!('companyId' in entity)) return;

        const contextCompanyId = getCompanyId();
        const isBypassed = isIsolationBypassed();

        if (isBypassed) return;

        if (contextCompanyId) {
            // If entity has a companyId set, check if it matches
            if (entity.companyId && entity.companyId !== contextCompanyId) {
                throw new Error(`Security Violation: Attempting to access/modify data from another company. Context: ${contextCompanyId}, Entity: ${entity.companyId}`);
            }

            // If not set, set it automatically (convenience + security)
            if (!entity.companyId) {
                entity.companyId = contextCompanyId;
            }
        }
    }
}
