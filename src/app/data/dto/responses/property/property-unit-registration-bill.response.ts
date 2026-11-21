// import { Type } from 'class-transformer';
// import { PropertyUnitFeeApiResponsePeriodTypeEnum } from '../../../../../sdk/property-api-sdk';
// import { PropertyUnitRegistrationBill } from '../../../entities/external/ledger/property-unit/property-unit-registration-bill.entity';
// import { NotificationApiPropertyUnitApiResponse } from './property-unit.response';

// export class PropertyUnitRegistrationBillApiResponse {
//     id: string;
//     version: number;
//     currency: string;
//     amount: number;

//     @Type(() => Date)
//     startedAt: Date;
//     @Type(() => Date)
//     endedAt: Date;

//     createdBy: string;
//     @Type(() => Date)
//     createdAt: Date;

//     deactivatedBy: string;
//     @Type(() => Date)
//     deactivatedAt: Date;

//     periodType: PropertyUnitFeeApiResponsePeriodTypeEnum;
//     periodTypeFee: number;
//     periodLength: number;

//     workspaceId: string;

//     @Type(() => NotificationApiPropertyUnitApiResponse)
//     propertyUnit: NotificationApiPropertyUnitApiResponse;

//     static fromEntity(entity: PropertyUnitRegistrationBill) {
//         const response = new PropertyUnitRegistrationBillApiResponse();
//         response.id = entity.id;
//         response.version = entity.audit.version;

//         response.amount = entity.amount;
//         response.currency = entity.currency;

//         response.startedAt = entity.startedAt;
//         response.endedAt = entity.endedAt;

//         response.createdBy = entity.audit.createdBy;
//         response.createdAt = entity.audit.createdAt;

//         response.deactivatedBy = entity.audit.deactivatedBy;
//         response.deactivatedAt = entity.audit.deactivatedAt;

//         response.periodType = entity.periodType;
//         response.periodTypeFee = entity.periodTypeFee;
//         response.periodLength = entity.periodLength;

//         // response.workspaceId = entity.workspaceId;
//         // if (entity.propertyOwner) {
//         //     response.propertyOwner = PropertyOwnerApiResponse.fromEntity(entity.propertyOwner);
//         // }
//         if (entity.propertyUnit) {
//             response.propertyUnit = NotificationApiPropertyUnitApiResponse.fromEntity(entity.propertyUnit);
//         }

//         return response;
//     }
// }
