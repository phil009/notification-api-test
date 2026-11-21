import { Injectable } from '@matchmakerjs/di';
import { EntityManager } from 'typeorm';
import { Property } from '../data/entities/external/property/property.entity';

@Injectable()
export class PropertyDao {
    constructor(private entityManager: EntityManager) {}

    async getAllById(ids: string[]): Promise<Property[]> {
        if (!ids?.length) return [];
        return this.entityManager
            .createQueryBuilder(Property, 'e')
            .leftJoinAndSelect('e.workspace', 'e_w')
            .leftJoinAndSelect('e.owner', 'o')
            .leftJoinAndSelect('o.workspace', 'o_w')
            .leftJoinAndSelect('e.address', 'addr')
            .leftJoinAndSelect('addr.lga', 'lga')
            .leftJoinAndSelect('lga.state', 'state')
            .leftJoinAndSelect('addr.country', 'country')
            .andWhere('e.id IN (:...ids)', { ids })
            .getMany();
    }
}
