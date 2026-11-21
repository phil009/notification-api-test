import { ElectricityMeterProvider } from '../../../entities/external/electricity/electricity-meter-provider.entity';

export class NotificationApiElectricityMeterProviderApiResponse {
    id?: string;
    version?: number;
    vendor: string;
    providerId: string;
    name: string;

    static fromEntity(entity: ElectricityMeterProvider) {
        const response = new NotificationApiElectricityMeterProviderApiResponse();
        response.id = entity.id;
        response.version = entity.audit.version;
        response.vendor = entity.vendor;
        response.providerId = entity.providerId;
        response.name = entity.name;
        return response;
    }
}
