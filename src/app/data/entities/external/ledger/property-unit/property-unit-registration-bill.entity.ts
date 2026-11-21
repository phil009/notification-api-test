// import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
// import { PropertyUnitFeeApiResponsePeriodTypeEnum } from '../../../../../../sdk/property-api-sdk';
// import { SyncAudit } from '../../../../embeddable/sync-audit.embeddable';
// import { SplitPayment } from '../../payment/split-payment.entity';
// import { PropertyUnit } from '../../property/property-unit.entity';

// @Entity()
// export class PropertyUnitRegistrationBill {
//     @PrimaryColumn('uuid')
//     id: string;

//     @Column({ type: 'decimal', scale: 2, nullable: false })
//     amount: number;

//     @Column({ nullable: false })
//     currency: string;

//     @ManyToOne(() => PropertyUnit, { nullable: false, createForeignKeyConstraints: false })
//     propertyUnit: PropertyUnit;

//     @Column({ nullable: true })
//     periodType: PropertyUnitFeeApiResponsePeriodTypeEnum;

//     @Column({ type: 'decimal', scale: 2, nullable: true })
//     periodTypeFee: number;

//     @Column({ nullable: true })
//     periodLength: number;

//     @Column({ nullable: true })
//     startedAt: Date;

//     @Column({ nullable: true })
//     endedAt: Date;

//     @ManyToOne(() => SplitPayment, { nullable: true, createForeignKeyConstraints: false })
//     payment: SplitPayment;

//     @Column((_) => SyncAudit, { prefix: false })
//     audit: SyncAudit = new SyncAudit();

//     static buildKeyById(id: string) {
//         return `/property-unit-fees/${id}`;
//     }
// }
