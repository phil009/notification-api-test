import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { SyncAudit } from '../../../../embeddable/sync-audit.embeddable';
import { SplitPayment } from '../../payment/split-payment.entity';
import { WalletTransaction } from '../../payment/wallet-transaction.entity';
import { OfflinePayment } from '../offline-payment.entity';
import { PropertyUnitSubscriptionLedger } from './property-unit-subscription-ledger.entity';

@Entity()
export class PropertyUnitSubscriptionPayment {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ nullable: false })
    currency: string;

    @Column({ type: 'decimal', scale: 2, nullable: false })
    amount: number;

    @ManyToOne(() => PropertyUnitSubscriptionLedger, { nullable: false, createForeignKeyConstraints: false })
    propertyUnitSubscriptionLedger: PropertyUnitSubscriptionLedger;

    @ManyToOne(() => WalletTransaction, { nullable: true, createForeignKeyConstraints: false })
    walletTransaction: WalletTransaction;

    @ManyToOne(() => SplitPayment, { nullable: true, createForeignKeyConstraints: false })
    splitPayment: SplitPayment;

    @ManyToOne(() => OfflinePayment, { nullable: true, createForeignKeyConstraints: false })
    offlinePayment: OfflinePayment;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();
}
