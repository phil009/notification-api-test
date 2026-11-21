import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { NoLog } from '@matchmakerjs/typeorm-audit';
import { SyncAudit } from '../../../embeddable/sync-audit.embeddable';
import { TenureLedger } from '../ledger/tenure/tenure-ledger.entity';
import { PropertyUnit } from '../property/property-unit.entity';

@NoLog()
@Entity({ synchronize: false, name: 'property_unit_tenure' })
export class _PropertyUnitTenure {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ nullable: true })
    lastExpiryNotificationAt: Date;
}

@Entity('property_unit_tenure')
export class PropertyUnitTenure {
    @PrimaryColumn('uuid')
    id: string;

    @ManyToOne(() => PropertyUnit, {
        nullable: false,
        createForeignKeyConstraints: false,
    })
    propertyUnit: PropertyUnit;

    @Column({ nullable: true })
    tenantName: string;

    @Column({ nullable: true })
    startedAt: Date;

    @Column({ nullable: true })
    endedAt: Date;

    @Column({ nullable: true })
    expiryNoticeAt: Date;

    @Column({ nullable: true, insert: false, update: false })
    lastExpiryNotificationAt: Date;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();

    defaultingLedgers: TenureLedger[];
}
