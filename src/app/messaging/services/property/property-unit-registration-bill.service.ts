// import { Injectable } from '@matchmakerjs/di';
// import { Transactional } from '@matchmakerjs/typeorm-audit';
// import { EntityManager } from 'typeorm';
// import { PropertyUnitFeeApiResponse } from '../../../../sdk/property-api-sdk';
// import { PropertyUnitRegistrationBill } from '../../../data/entities/external/ledger/property-unit/property-unit-registration-bill.entity';
// import { SplitPayment } from '../../../data/entities/external/payment/split-payment.entity';
// import { PropertyUnit } from '../../../data/entities/external/property/property-unit.entity';

// @Injectable()
// export class PropertyUnitRegistrationBillService {
//     constructor(private entityManager: EntityManager) {}

//     @Transactional()
//     async createBillFromMessage(message: PropertyUnitFeeApiResponse): Promise<PropertyUnitRegistrationBill> {
//         const entity = new PropertyUnitRegistrationBill();
//         entity.id = message.id;
//         await this.updateBillFromMessage(entity, message);
//         return entity;
//     }

//     @Transactional()
//     async updateBillFromMessage(entity: PropertyUnitRegistrationBill, message: PropertyUnitFeeApiResponse) {
//         entity.propertyUnit = message.propertyUnit && ({ id: message.propertyUnit.id } as PropertyUnit);
//         entity.payment = message.paymentId && ({ id: message.paymentId } as SplitPayment);

//         entity.currency = message.currency;
//         entity.amount = message.amount;

//         entity.periodType = message?.periodType;
//         entity.periodLength = message?.periodLength;
//         entity.periodTypeFee = message.periodTypeFee;

//         entity.startedAt = message.startedAt && new Date(message.startedAt);
//         entity.endedAt = message.endedAt && new Date(message.endedAt);

//         entity.audit.version = message.version;
//         entity.audit.createdAt = message.createdAt && new Date(message.createdAt);
//         entity.audit.deactivatedAt = message.deactivatedAt && new Date(message.deactivatedAt);
//         entity.audit.deactivatedBy = message.deactivatedBy;

//         await this.entityManager.save(entity);
//     }
// }
