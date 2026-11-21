import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { ElectricityUnitPurchaseApiResponse } from '../../../../sdk/vending-api-sdk';
import { ELECTRICITY_UNIT_PURCHASE_TOPIC } from '../../../constants/topics.constant';
import { ElectricityUnitPurchase } from '../../../data/entities/external/electricity/electricity-unit-purchase.entity';
import { ElectricityUnitPurchaseService } from '../../services/electricity/electricity-unit-purchase.service';

@Injectable()
export class ElectricityUnitPurchaseMessageListener implements MessageListener {
    constructor(
        private entityManager: EntityManager,
        private electricityUnitPurchaseService: ElectricityUnitPurchaseService,
    ) {}

    @Activity('ELECTRICITY UNIT PURCHASE NOTIFICATION')
    async processMessage(message: Buffer): Promise<void> {
        const dto: ElectricityUnitPurchaseApiResponse = JSON.parse(message.toString());

        const entity = await this.entityManager.getRepository(ElectricityUnitPurchase).findOne(dto.id.toString(), {
            relations: ['notification'],
        });

        if (!entity) {
            await this.electricityUnitPurchaseService.create(dto);
        } else if (entity.audit.version <= dto.version) {
            await this.electricityUnitPurchaseService.update(entity, dto);
        }
    }

    getTopic(): string {
        return ELECTRICITY_UNIT_PURCHASE_TOPIC;
    }
}
