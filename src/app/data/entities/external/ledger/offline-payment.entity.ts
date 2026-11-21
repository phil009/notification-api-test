import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';
import { OfflinePaymentApiResponseStatusEnum } from '../../../../../sdk/ledger-api-sdk';
import { SyncAudit } from '../../../embeddable/sync-audit.embeddable';
import { Notification } from '../../notification.entity';
import { Workspace } from '../workspace/workspace.entity';

@Entity()
export class OfflinePayment {
    @PrimaryColumn('uuid')
    id: string;

    @ManyToOne(() => Workspace, { nullable: true, createForeignKeyConstraints: false })
    workspace: Workspace;

    @Column({ nullable: false })
    currency: string;

    @Column({ type: 'decimal', scale: 2 })
    amount: number;

    @Column({ nullable: true })
    payerName: string;

    @Column({ nullable: false, type: 'date' })
    paymentDate: string;

    @Column({ nullable: false })
    paymentChannel: string;

    @Column({ nullable: true })
    paymentReference: string;

    @Column({ nullable: true })
    comment: string;

    @Column({ nullable: true })
    submittedBy: string;

    @Column({ nullable: true })
    reviewedBy: string;

    @Column({ nullable: true })
    reviewedAt: Date;

    @Column({ nullable: true })
    reasonForRejection: string;

    @Column({ nullable: false })
    status: OfflinePaymentApiResponseStatusEnum;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();

    @OneToOne(() => Notification, { nullable: true })
    @JoinColumn()
    notification: Notification;
}
