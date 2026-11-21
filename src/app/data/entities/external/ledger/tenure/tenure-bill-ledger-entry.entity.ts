import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { TenureLedgerApiResponseTypeEnum } from '../../../../../../sdk/ledger-api-sdk';
import { SyncAudit } from '../../../../embeddable/sync-audit.embeddable';
import { PropertyUnitTenure } from '../../tenure/property-unit-tenure.entity';
import { TenureLedger } from './tenure-ledger.entity';

@Entity()
export class TenureBillLedgerEntry {
    @PrimaryColumn('uuid')
    id: string;

    @ManyToOne(() => PropertyUnitTenure, { nullable: false, createForeignKeyConstraints: false })
    tenure: PropertyUnitTenure;

    @ManyToOne(() => TenureLedger, { nullable: false, createForeignKeyConstraints: false })
    tenureLedger: TenureLedger;

    @Column({ nullable: false })
    ledgerType: TenureLedgerApiResponseTypeEnum;

    @Column({ type: 'uuid', nullable: true, unique: true })
    originalBillId: string;

    @Column({ type: 'decimal', scale: 2, nullable: false })
    amount: number;

    @Column({ nullable: false })
    currency: string;

    @Column({ nullable: true })
    effectiveAt: Date;

    @Column({ nullable: true })
    startedAt: Date;

    @Column({ nullable: true })
    endedAt: Date;

    @Column({ nullable: true })
    expiryNoticeAt: Date;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();
}
