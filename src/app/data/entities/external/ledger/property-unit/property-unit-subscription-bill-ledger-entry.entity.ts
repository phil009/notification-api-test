import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { SyncAudit } from '../../../../embeddable/sync-audit.embeddable';
import { PropertyUnitSubscriptionLedger } from './property-unit-subscription-ledger.entity';

@Entity()
export class PropertyUnitSubscriptionBillLedgerEntry {
    @PrimaryColumn('uuid')
    id: string;

    @ManyToOne(() => PropertyUnitSubscriptionLedger, { nullable: false, createForeignKeyConstraints: false })
    propertyUnitSubscriptionLedger: PropertyUnitSubscriptionLedger;

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

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();
}
