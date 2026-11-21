// import { Injectable } from '@matchmakerjs/di';
// import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
// import { RedisLockService } from '@matchmakerjs/matchmaker-redis';
// import { Activity } from '@matchmakerjs/typeorm-audit';
// import { EntityManager } from 'typeorm';
// import { PropertyUnitFeeApiResponse, PropertyUnitFeeApiResponseTypeEnum } from '../../../../sdk/property-api-sdk';
// import { PROPERTY_UNIT_FEE_TOPIC } from '../../../constants/topics.constant';
// import { PropertyUnitRegistrationBill } from '../../../data/entities/external/ledger/property-unit/property-unit-registration-bill.entity';
// import { PropertyUnitRegistrationBillService } from '../../services/property/property-unit-registration-bill.service';

// @Injectable()
// export class PropertyUnitFeeMessageListener implements MessageListener {
//     constructor(
//         private entityManager: EntityManager,
//         private redisLockService: RedisLockService,
//         private propertyUnitSubscriptionBillService: PropertyUnitRegistrationBillService,
//     ) {}

//     @Activity('PROPERTY UNIT FEE NOTIFICATION')
//     async processMessage(message: Buffer): Promise<void> {
//         const dto: PropertyUnitFeeApiResponse = JSON.parse(message.toString());
//         if (dto.type !== PropertyUnitFeeApiResponseTypeEnum.Registration || !dto.propertyUnit) {
//             return;
//         }
//         await this.redisLockService.execute(PropertyUnitRegistrationBill.buildKeyById(dto.id), async () => {
//             const entity = await this.entityManager
//                 .createQueryBuilder(PropertyUnitRegistrationBill, 'e')
//                 .where('e.id = :id', { id: dto.id })
//                 .getOne();
//             if (!entity) {
//                 return this.propertyUnitSubscriptionBillService.createBillFromMessage(dto);
//             } else {
//                 return this.propertyUnitSubscriptionBillService.updateBillFromMessage(entity, dto);
//             }
//         });
//     }

//     getTopic(): string {
//         return PROPERTY_UNIT_FEE_TOPIC;
//     }
// }
