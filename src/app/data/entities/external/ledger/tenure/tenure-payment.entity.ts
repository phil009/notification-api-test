import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';
import { SyncAudit } from '../../../../embeddable/sync-audit.embeddable';
import { Notification } from '../../../notification.entity';
import { WalletTransaction } from '../../payment/wallet-transaction.entity';
import { OfflinePayment } from '../offline-payment.entity';
import { TenureLedger } from './tenure-ledger.entity';

@Entity()
export class TenurePayment {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ nullable: false })
    currency: string;

    @Column({ type: 'decimal', scale: 2, nullable: false })
    amount: number;

    @ManyToOne(() => TenureLedger, { nullable: false, createForeignKeyConstraints: false })
    tenureLedger: TenureLedger;

    @ManyToOne(() => WalletTransaction, { nullable: true, createForeignKeyConstraints: false })
    walletTransaction: WalletTransaction;

    @ManyToOne(() => OfflinePayment, { nullable: true, createForeignKeyConstraints: false })
    offlinePayment: OfflinePayment;

    @OneToOne(() => Notification, { nullable: true })
    @JoinColumn()
    notification: Notification;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();
}
