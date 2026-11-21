import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { SyncAudit } from '../../../embeddable/sync-audit.embeddable';
import { Customer } from './customer.entity';
import { Wallet } from './wallet.entity';

@Entity('customer_wallet')
export class CustomerWallet {
    @PrimaryColumn('uuid')
    id: string;

    @ManyToOne(() => Wallet, { nullable: false, createForeignKeyConstraints: false })
    wallet: Wallet;

    @ManyToOne(() => Customer, { nullable: false, createForeignKeyConstraints: false })
    customer: Customer;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();
}
