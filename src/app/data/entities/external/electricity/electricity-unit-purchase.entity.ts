import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';
import { SyncAudit } from '../../../embeddable/sync-audit.embeddable';
import { Notification } from '../../notification.entity';
import { WalletTransaction } from '../payment/wallet-transaction.entity';
import { ElectricityMeter } from './electricity-meter.entity';

@Entity()
export class ElectricityUnitPurchase {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ nullable: false, unique: true })
    requestReference: string;

    @ManyToOne(() => ElectricityMeter, { nullable: true, createForeignKeyConstraints: false })
    meter: ElectricityMeter;

    @ManyToOne(() => WalletTransaction, { nullable: true, createForeignKeyConstraints: false })
    walletTransaction: WalletTransaction;

    @Column({ nullable: false })
    phoneNumber: string;

    @Column()
    currency: string;

    @Column({ nullable: false, type: 'decimal', scale: 2 })
    amount: number;

    @Column({ nullable: false, type: 'decimal', scale: 2 })
    serviceCharge: number;

    @Column()
    status: string;

    @Column({ nullable: true })
    startedAt: Date;

    @Column({ nullable: true })
    endedAt: Date;

    @Column({ nullable: true })
    failureType: string;

    @Column({ nullable: true })
    serviceToken: string;

    @Column({ nullable: true })
    allocatedUnits: string;

    @Column({ nullable: true, type: 'decimal', scale: 2 })
    serviceAmount: number;

    @Column({ nullable: true, type: 'decimal', scale: 2 })
    vat: number;

    @Column({ nullable: true, type: 'decimal', scale: 2 })
    debt: number;

    @Column({ nullable: true, unique: true })
    receiptNumber: string;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();

    @OneToOne(() => Notification, { nullable: true })
    @JoinColumn()
    notification: Notification;
}
