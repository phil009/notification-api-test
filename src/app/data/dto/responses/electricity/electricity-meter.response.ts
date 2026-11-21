import { ElectricityMeter } from '../../../entities/external/electricity/electricity-meter.entity';
import { NotificationApiElectricityMeterProviderApiResponse } from './electricity-meter-provider.response';

export class NotificationApiElectricityMeterApiResponse {
    id?: string;
    version?: number;
    providerId: string;
    providerName: string;
    meterNumber: string;
    meterName: string;
    address: string;
    phoneNumber: string;
    outstandingBalance?: number;
    district: string;

    provider?: NotificationApiElectricityMeterProviderApiResponse;

    static fromEntity(entity: ElectricityMeter) {
        const response = new NotificationApiElectricityMeterApiResponse();
        response.id = entity.id;
        response.version = entity.audit.version;
        response.providerId = entity.provider.providerId;
        response.providerName = entity.provider.name;
        response.meterNumber = entity.meterNumber;
        response.meterName = entity.meterName;
        response.address = entity.address;
        response.phoneNumber = entity.phoneNumber;
        if (entity.provider) {
            response.provider = NotificationApiElectricityMeterProviderApiResponse.fromEntity(entity.provider);
        }
        return response;
    }
}
