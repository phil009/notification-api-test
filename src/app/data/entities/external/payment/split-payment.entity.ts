import { Column, Entity, OneToOne, PrimaryColumn } from 'typeorm';
import { SplitPaymentApiResponseStatusEnum } from '../../../../../sdk/payment-api-sdk';
import { SyncAudit } from '../../../embeddable/sync-audit.embeddable';
// import { PropertyUnitRegistrationBill } from '../ledger/property-unit/property-unit-registration-bill.entity';
import { PropertyUnitSubscriptionPayment } from '../ledger/property-unit/property-unit-subscription-payment.entity';

@Entity()
export class SplitPayment {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ nullable: false })
    currency: string;

    @Column({ type: 'decimal', scale: 2 })
    amount: number;

    @Column({ nullable: false })
    status: SplitPaymentApiResponseStatusEnum;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();

    // @OneToOne(() => PropertyUnitRegistrationBill, (rel) => rel.payment)
    // propertyUnitRegistrationBill: PropertyUnitRegistrationBill;

    @OneToOne(() => PropertyUnitSubscriptionPayment, (rel) => rel.splitPayment)
    propertyUnitSubscriptionPayment: PropertyUnitSubscriptionPayment;
}
