import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { SyncAudit } from '../../../../embeddable/sync-audit.embeddable';
import { PropertyOwner } from '../../property/property-owner.entity';
import { Workspace } from '../../workspace/workspace.entity';

@Entity()
export class PropertyUnitSubscriptionLedger {
    @PrimaryColumn('uuid')
    id: string;

    @ManyToOne(() => Workspace, {
        nullable: true,
        createForeignKeyConstraints: false,
    })
    workspace: Workspace;

    @ManyToOne(() => PropertyOwner, {
        nullable: true,
        createForeignKeyConstraints: false,
    })
    propertyOwner: PropertyOwner;

    @Column({ nullable: false })
    currency: string;

    @Column({ type: 'decimal', scale: 2, nullable: false })
    sumOfInvoicesIssued: number;

    @Column({ type: 'decimal', scale: 2, nullable: false })
    sumOfPaymentsReceived: number;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();
}
