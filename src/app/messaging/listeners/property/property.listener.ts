import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { PropertyApiResponse } from '../../../../sdk/property-api-sdk';
import { PLACE_TOPIC } from '../../../constants/topics.constant';
import { Property } from '../../../data/entities/external/property/property.entity';
import { PropertyService } from '../../services/property/property.service';

@Injectable()
export class PropertyMessageListener implements MessageListener {
    constructor(private entityManager: EntityManager, private propertyService: PropertyService) { }

    @Activity('PLACE NOTIFICATION')
    async processMessage(message: Buffer): Promise<void> {
        const dto: PropertyApiResponse = JSON.parse(message.toString());

        const entity = await this.entityManager.getRepository(Property).findOne({ where: { id: dto.id }, withDeleted: true });
        if(!dto.portfolio && !dto.supersets?.length){
            console.log(`Property ${dto.id} has no portfolio and supersets`);
        }
        if (!entity) {
            await this.propertyService.createProperty(dto);
        } else {
            await this.propertyService.updateProperty(entity, dto);
        }
    }

    getTopic(): string {
        return PLACE_TOPIC;
    }
}
