import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { TenureLedgerApiResponseTypeEnum } from '../../../../../../sdk/ledger-api-sdk';
import { SyncAudit } from '../../../../embeddable/sync-audit.embeddable';
import { PropertyUnitTenure } from '../../tenure/property-unit-tenure.entity';

@Entity()
export class TenureLedger {
    @PrimaryColumn('uuid')
    id: string;

    @ManyToOne(() => PropertyUnitTenure, { nullable: false, createForeignKeyConstraints: false })
    tenure: PropertyUnitTenure;

    @Column({ nullable: false })
    type: TenureLedgerApiResponseTypeEnum;

    @Column({ nullable: false })
    currency: string;

    @Column({ type: 'decimal', scale: 2, nullable: false })
    sumOfInvoicesIssued: number;

    @Column({ type: 'decimal', scale: 2, nullable: false })
    sumOfPaymentsReceived: number;

    @Column({ nullable: true })
    defaultedAt: Date;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();

    outstanding: number;
}
