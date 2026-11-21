import { Audit, NoLog } from "@matchmakerjs/typeorm-audit";
import {
    Column,
    Entity,
    OneToOne,
    PrimaryGeneratedColumn,
    Unique,
    VersionColumn,
} from "typeorm";
import { NotificationType } from "../enums/notification-type.enum";
import { ElectricityUnitPurchase } from "./external/electricity/electricity-unit-purchase.entity";
import { OfflinePayment } from "./external/ledger/offline-payment.entity";
import { TenurePayment } from "./external/ledger/tenure/tenure-payment.entity";
import { WalletTransaction } from "./external/payment/wallet-transaction.entity";

@Unique(["type", "sourceReference"])
@Entity("notification")
export class Notification {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @VersionColumn()
    version: number;

    @Column({ nullable: false })
    title: string;

    @Column({ nullable: true })
    message: string;

    @Column({ nullable: false })
    type: NotificationType;

    @Column({ nullable: true })
    sourceReference: string;

    @Column({ nullable: true })
    notificationSentAt: Date;

    @Column({ nullable: true })
    sendClaimedAt: Date;

    @NoLog()
    @OneToOne(() => WalletTransaction, (rel) => rel.notification)
    walletTransaction: WalletTransaction;

    // @NoLog()
    // @OneToOne(() => TenureServiceCharge, (rel) => rel.notification)
    // tenureServiceCharge: TenureServiceCharge;

    @NoLog()
    @OneToOne(() => ElectricityUnitPurchase, (rel) => rel.notification)
    electricityUnitPurchase: ElectricityUnitPurchase;

    @NoLog()
    @OneToOne(() => OfflinePayment, (rel) => rel.notification)
    offlinePayment: OfflinePayment;

    @NoLog()
    @OneToOne(() => TenurePayment, (rel) => rel.notification)
    tenurePayment: TenurePayment;

    @Column((_) => Audit, { prefix: false })
    audit: Audit = new Audit();
}

@Entity({ name: "notification", synchronize: false })
export class UserNotification extends Notification {
    @Column({ name: "first_viewed_at", select: false })
    firstViewedAt: Date;

    @Column({ name: "user_id", select: false })
    userId: string;
}
