import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { SyncAudit } from '../../../embeddable/sync-audit.embeddable';
import { PortalUser } from '../portal-user.entity';
import { PropertyOwner } from '../property/property-owner.entity';
import { Workspace } from '../workspace/workspace.entity';
import { Customer } from './customer.entity';

@Entity()
export class Wallet {
    @PrimaryColumn('uuid')
    id: string;

    @ManyToOne(() => Customer, { nullable: true, createForeignKeyConstraints: false })
    customer: Customer;

    @ManyToOne(() => PortalUser, { nullable: true, createForeignKeyConstraints: false })
    @JoinColumn({ name: 'customer_user_id' })
    portalUser: PortalUser;

    @ManyToOne(() => Workspace, { nullable: true, createForeignKeyConstraints: false })
    @JoinColumn()
    workspace: Workspace;

    @ManyToOne(() => PropertyOwner, { nullable: true, createForeignKeyConstraints: false })
    @JoinColumn()
    propertyOwner: PropertyOwner;

    @Column({ nullable: false })
    currency: string;

    @Column({ nullable: true, type: 'decimal', scale: 2 })
    balance: number;

    @Column({ nullable: true })
    balanceLastUpdatedAt: Date;

    @Column({ nullable: true, type: 'decimal', scale: 2 })
    sumOfQueuedDebitTransactions: number;

    @Column({ nullable: true })
    isFreeCredit: boolean;

    @Column({ nullable: true })
    expiresAt: Date;

    @Column((_) => SyncAudit, { prefix: false })
    audit = new SyncAudit();
}
