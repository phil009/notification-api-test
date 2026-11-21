import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity, Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { TenureLedgerEntryApiResponse } from '../../../../sdk/ledger-api-sdk';
import { TENURE_LEDGER_ENTRY_TOPIC } from '../../../constants/topics.constant';
import { TenureBillLedgerEntry } from '../../../data/entities/external/ledger/tenure/tenure-bill-ledger-entry.entity';
import { TenureLedger } from '../../../data/entities/external/ledger/tenure/tenure-ledger.entity';
import { TenureBillLedgerEntryService } from '../../services/ledger/tenure-bill-ledger-entry.service';
import { TenureLedgerService } from '../../services/ledger/tenure-ledger.service';

@Injectable()
export class TenureLedgerEntryMessageListener implements MessageListener {
    constructor(
        private entityManager: EntityManager,
        private tenureLedgerEntryService: TenureBillLedgerEntryService,
        private tenureLedgerService: TenureLedgerService,
    ) {}

    @Activity('TENURE LEDGER ENTRY NOTIFICATION')
    @Transactional()
    async processMessage(message: Buffer): Promise<void> {
        const dto: TenureLedgerEntryApiResponse = JSON.parse(message.toString());

        const ledgerEntity = await this.entityManager.getRepository(TenureLedger).findOne({ id: dto.tenureLedger.id });
        if (!ledgerEntity) {
            await this.tenureLedgerService.create(dto.tenureLedger);
        } else {
            await this.tenureLedgerService.update(ledgerEntity, dto.tenureLedger);
        }

        if (!dto.adhocBill && !dto.scheduledBill) {
            return;
        }
        if (!dto.tenureLedger?.tenure) {
            return;
        }

        const query = this.entityManager
            .createQueryBuilder(TenureBillLedgerEntry, 'e')
            .withDeleted()
            .where('e.id = :id', { id: dto.id });
        if (dto.scheduledBill) {
            query.orWhere('e.originalBillId = :originalBillId', { originalBillId: dto.scheduledBill.id });
        }
        const entity = await query.getOne();
        if (!entity) {
            await this.tenureLedgerEntryService.create(dto);
        } else {
            await this.tenureLedgerEntryService.update(entity, dto);
        }
    }

    getTopic(): string {
        return TENURE_LEDGER_ENTRY_TOPIC;
    }
}
