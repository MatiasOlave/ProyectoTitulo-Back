import { getScopedRepository } from '../../utils/scoped-repository';
import { Level } from '../../entities/students/level.entity';

export const levelService = {
    async listLevels(companyId: string) {
        const levelRepo = getScopedRepository(Level);

        const levels = await levelRepo.find({
            where: { isActive: true },
            order: { displayOrder: 'ASC', name: 'ASC' }
        });

        return levels;
    },

    // Simple getById if needed later
    async getLevelById(id: string) {
        const levelRepo = getScopedRepository(Level);
        const level = await levelRepo.findOne({ where: { id } });
        if (!level) throw new Error('Curso no encontrado');
        return level;
    }
};
