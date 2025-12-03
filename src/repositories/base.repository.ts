// src/repositories/base.repository.ts
import { FindOptionsWhere, FindManyOptions } from 'typeorm';
import { AppDataSource } from '../config/database';

export const createIsolatedRepository = <T extends { companyId?: string }>(
  entityClass: new () => T
) => {
  const repository = AppDataSource.getRepository(entityClass);

  const buildWhere = (
    companyId: string,
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[]
  ): FindOptionsWhere<T> | FindOptionsWhere<T>[] => {
    if (!where) {
      return { companyId } as FindOptionsWhere<T>;
    }

    if (Array.isArray(where)) {
      return where.map(condition => {
        if (typeof condition === 'object' && condition !== null) {
          return {
            ...(condition as object),
            companyId,
          } as FindOptionsWhere<T>;
        }
        return { companyId } as FindOptionsWhere<T>;
      }) as FindOptionsWhere<T>[];
    }

    if (typeof where === 'object' && where !== null) {
      return {
        ...(where as object),
        companyId,
      } as FindOptionsWhere<T>;
    }

    return { companyId } as FindOptionsWhere<T>;
  };

  return {
    findWithIsolation: (companyId: string, options?: FindManyOptions<T>) => {
      return repository.find({
        ...options,
        where: buildWhere(companyId, options?.where),
      });
    },

    findOneWithIsolation: (companyId: string, options?: FindManyOptions<T>) => {
      return repository.findOne({
        ...options,
        where: buildWhere(companyId, options?.where),
      });
    },

    countWithIsolation: (companyId: string, options?: FindManyOptions<T>) => {
      return repository.count({
        ...options,
        where: buildWhere(companyId, options?.where),
      });
    },

    originalRepository: repository,
  };
};
