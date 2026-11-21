import { NoLog } from '@matchmakerjs/typeorm-audit';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';
import { SyncAudit } from '../../../embeddable/sync-audit.embeddable';
import { Notification } from '../../notification.entity';
import { ElectricityUnitPurchase } from '../electricity/electricity-unit-purchase.entity';
import { PropertyUnitSubscriptionPayment } from '../ledger/property-unit/property-unit-subscription-payment.entity';
import { Customer } from './customer.entity';
import { SplitPayment } from './split-payment.entity';
import { Wallet } from './wallet.entity';

@Entity()
export class WalletTransaction {
    @PrimaryColumn('uuid')
    id: string;

    @ManyToOne(() => Customer, { nullable: true, createForeignKeyConstraints: false })
    customer: Customer;

    @ManyToOne(() => Wallet, { nullable: true, createForeignKeyConstraints: false })
    wallet: Wallet;

    @Column({ nullable: false })
    currency: string;

    @Column({ type: 'decimal', scale: 2 })
    amount: number;

    @Column({ nullable: false })
    type: string;

    @Column({ nullable: false })
    source: string;

    @Column({ nullable: false })
    status: string;

    @Column({ nullable: true })
    startedAt: Date;

    @Column({ nullable: true })
    endedAt: Date;

    @Column({ nullable: true, type: 'decimal', scale: 2 })
    walletBalanceAtStart: number;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();

    @OneToOne(() => Notification, { nullable: true })
    @JoinColumn()
    notification: Notification;

    @ManyToOne(() => SplitPayment, { nullable: true, createForeignKeyConstraints: false })
    splitPayment: SplitPayment;

    @NoLog()
    @OneToOne(() => ElectricityUnitPurchase, (rel) => rel.walletTransaction)
    electricityUnitPurchase: ElectricityUnitPurchase;

    @NoLog()
    @OneToOne(() => PropertyUnitSubscriptionPayment, (rel) => rel.walletTransaction)
    propertyUnitSubscriptionPayment: PropertyUnitSubscriptionPayment;
}
