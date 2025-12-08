import { ObjectType, Repository, FindManyOptions, FindOneOptions, DeepPartial, SaveOptions } from 'typeorm';
import { AppDataSource } from '../config/database';
import { getCompanyId, isIsolationBypassed } from './context';

export class ScopedRepository<T extends { companyId: string }> {
    private repository: Repository<T>;

    constructor(entity: ObjectType<T>) {
        this.repository = AppDataSource.getRepository(entity);
    }

    private getScope(): { companyId?: string } {
        if (isIsolationBypassed()) return {};
        const companyId = getCompanyId();
        if (!companyId) return {}; // Or throw error if strict mode
        return { companyId };
    }

    async find(options?: FindManyOptions<T>): Promise<T[]> {
        const scope = this.getScope();
        return this.repository.find({
            ...options,
            where: {
                ...(options?.where || {}),
                ...scope,
            } as any,
        });
    }

    async findOne(options: FindOneOptions<T>): Promise<T | null> {
        const scope = this.getScope();
        return this.repository.findOne({
            ...options,
            where: {
                ...(options?.where || {}),
                ...scope,
            } as any,
        });
    }

    // Proxy other methods as needed, or expose repository for unsafe operations if needed
    // But for "Strategy", we should encourage using this wrapper.

    create(entityLike: DeepPartial<T>): T {
        const entity = this.repository.create(entityLike);
        const companyId = getCompanyId();
        console.log('companyId desde scoped-repository:', companyId);
        if (companyId && !isIsolationBypassed()) {
            (entity as any).companyId = companyId;
        }
        return entity;
    }

    async save(entity: T, options?: SaveOptions): Promise<T> {
        // Subscriber will also check this, but good to be explicit
        return this.repository.save(entity, options);
    }

    async remove(entity: T): Promise<T> {
        return this.repository.remove(entity);
    }
}

// Helper to easily get a scoped repository
export function getScopedRepository<T extends { companyId: string }>(entity: ObjectType<T>): ScopedRepository<T> {
    return new ScopedRepository(entity);
}
