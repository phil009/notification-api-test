import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity, Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { PropertyUnitSubscriptionLedgerEntryApiResponse } from '../../../../sdk/ledger-api-sdk';
import { PROPERTY_UNIT_SUBSCRIPTION_LEDGER_ENTRY_TOPIC } from '../../../constants/topics.constant';
import { PropertyUnitSubscriptionBillLedgerEntry } from '../../../data/entities/external/ledger/property-unit/property-unit-subscription-bill-ledger-entry.entity';
import { PropertyUnitSubscriptionLedger } from '../../../data/entities/external/ledger/property-unit/property-unit-subscription-ledger.entity';
import { PropertyUnitSubscriptionBillLedgerEntryService } from '../../services/ledger/property-unit-subscription-bill-ledger-entry.service';
import { PropertyUnitSubscriptionLedgerService } from '../../services/ledger/property-unit-subscription-ledger.service';

@Injectable()
export class PropertyUnitSubscriptionLedgerEntryMessageListener implements MessageListener {
    constructor(
        private entityManager: EntityManager,
        private propertyUnitSubscriptionBillLedgerEntryService: PropertyUnitSubscriptionBillLedgerEntryService,
        private propertyUnitSubscriptionLedgerService: PropertyUnitSubscriptionLedgerService,
    ) { }

    @Activity('PROPERTY UNIT SUBSCRIPTION LEDGER ENTRY NOTIFICATION')
    @Transactional()
    async processMessage(message: Buffer): Promise<void> {
        const dto: PropertyUnitSubscriptionLedgerEntryApiResponse = JSON.parse(message.toString());

        if (!dto?.subscriptionLedger) {
            console.warn(`Ignored property unit subscription ledger entry ${dto.id}`);
            return;
        }

        const ledgerEntity = await this.entityManager
            .getRepository(PropertyUnitSubscriptionLedger)
            .findOne({ id: dto.subscriptionLedger.id });

        if (!ledgerEntity) {
            await this.propertyUnitSubscriptionLedgerService.create(dto.subscriptionLedger);
        } else {
            await this.propertyUnitSubscriptionLedgerService.update(ledgerEntity, dto.subscriptionLedger);
        }

        if (dto.scheduledBill) {
            const qb = this.entityManager
                .createQueryBuilder(PropertyUnitSubscriptionBillLedgerEntry, 'e')
                .where('e.id = :id', { id: dto.id });

            if (dto.scheduledBill) {
                qb.orWhere('e.originalBillId = :originalBillId', { originalBillId: dto.scheduledBill.id });
            }
            const entity = await qb.getOne();

            if (!entity) {
                await this.propertyUnitSubscriptionBillLedgerEntryService.create(dto);
            } else {
                await this.propertyUnitSubscriptionBillLedgerEntryService.update(entity, dto);
            }
        }
    }

    getTopic(): string {
        return PROPERTY_UNIT_SUBSCRIPTION_LEDGER_ENTRY_TOPIC;
    }
}
