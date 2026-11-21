import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import {
    ElectricityUnitPurchaseApiResponse,
    ElectricityUnitPurchaseApiResponseStatusEnum,
    VendingApiCustomerApiResponseTypeEnum,
} from '../../../../sdk/vending-api-sdk';
import { NotificationDao } from '../../../dao/notification.dao';
import { ElectricityMeter } from '../../../data/entities/external/electricity/electricity-meter.entity';
import { ElectricityUnitPurchase } from '../../../data/entities/external/electricity/electricity-unit-purchase.entity';
import { WalletTransaction } from '../../../data/entities/external/payment/wallet-transaction.entity';
import { Notification } from '../../../data/entities/notification.entity';
import { NotificationType } from '../../../data/enums/notification-type.enum';
import { NotificationTargetService } from '../../../services/notification-target.service';
import dayjs from 'dayjs';

@Injectable()
export class ElectricityUnitPurchaseService {
    constructor(
        private entityManager: EntityManager,
        private notificationDao: NotificationDao,
        private notificationRecipientService: NotificationTargetService,
    ) {}

    @Transactional()
    async create(data: ElectricityUnitPurchaseApiResponse): Promise<ElectricityUnitPurchase> {
        const entity = new ElectricityUnitPurchase();
        entity.id = data.id.toString();
        await this.update(entity, data);
        return entity;
    }

    @Transactional()
    async update(entity: ElectricityUnitPurchase, data: ElectricityUnitPurchaseApiResponse): Promise<void> {
        const meter = new ElectricityMeter();
        meter.id = data.meter.id;

        const walletTransaction = new WalletTransaction();
        walletTransaction.id = data.walletTransactionId;

        entity.meter = meter;
        entity.walletTransaction = walletTransaction;
        entity.phoneNumber = data.phoneNumber;
        entity.currency = data.currency;
        entity.amount = data.amount;
        entity.serviceCharge = data.serviceCharge;

        entity.requestReference = data.requestReference;
        entity.status = data.status;
        entity.failureType = data.failureType;

        entity.serviceAmount = data.serviceAmount;
        entity.serviceToken = data.serviceToken;
        entity.allocatedUnits = data.allocatedUnits;
        entity.debt = data.debt;
        entity.vat = data.vat;

        entity.startedAt = data.startedAt && new Date(data.startedAt);
        entity.endedAt = data.endedAt && new Date(data.endedAt);

        entity.audit.version = data.version;

        if (
            !entity.notification &&
            entity.status === ElectricityUnitPurchaseApiResponseStatusEnum.Successful &&
            dayjs(entity.startedAt).add(1, 'minute').isBefore(entity.endedAt)
        ) {
            if (data.meter.customer.type === VendingApiCustomerApiResponseTypeEnum.User) {
                entity.notification = await this.createNotificationForUser(entity, data.meter.customer.reference);
            }
        }

        await this.entityManager.save(entity);
    }

    private async createNotificationForUser(electricityUnitPurchase: ElectricityUnitPurchase, userId: string) {
        const notification = await this.notificationDao.findNotificationBySource({
            type: NotificationType.ELECTRICITY_UNIT_PURCHASE,
            sourceReference: electricityUnitPurchase.id,
        });
        if (notification) return notification;

        const entity = new Notification();
        entity.title = `Electricity token generated: ${electricityUnitPurchase.serviceToken}`;
        entity.type = NotificationType.ELECTRICITY_UNIT_PURCHASE;
        entity.sourceReference = electricityUnitPurchase.id;
        await this.entityManager.save(entity);

        await this.notificationRecipientService.createForUser(entity, userId);
        return entity;
    }
}
