import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import dayjs from 'dayjs';
import { EntityManager } from 'typeorm';
import { StringUtils } from '../../utils/string.util';
import { NotificationDao } from '../dao/notification.dao';
import { PropertyUnit } from '../data/entities/external/property/property-unit.entity';
import { PropertyUnitOccupant } from '../data/entities/external/tenure/property-unit-occupant.entity';
import { Notification } from '../data/entities/notification.entity';
import { NotificationType } from '../data/enums/notification-type.enum';
import { NotificationTargetService } from './notification-target.service';

export type RentDueReminderEmailTemplateData = {
    occupantName: string;
    propertyName: string;
    unitNumber: string;
    dueDate: string;
    daysLeft: number;
    dashboardLink: string;
};

@Injectable()
export class RentDueReminderNotificationService {
    constructor(
        private entityManager: EntityManager,
        private notificationDao: NotificationDao,
        private notificationTargetService: NotificationTargetService,
    ) {}

    /**
     * Adds the in-app (and push) counterpart of the rent-due email/SMS. There are exactly three
     * reminders per tenancy (30, 7, 1 days out), so keying on occupant + daysLeft gives each of
     * them its own notification instead of collapsing them into one.
     */
    @Transactional()
    async createInAppNotification(occupant: PropertyUnitOccupant, daysLeft: number): Promise<void> {
        const userId = occupant.user?.userId;
        if (!userId) return;

        const sourceReference = `${occupant.id}:${daysLeft}`;
        const existing = await this.notificationDao.findNotificationBySource({
            type: NotificationType.RENT_DUE_REMINDER,
            sourceReference,
        });
        if (existing) return;

        const dueDate = dayjs(occupant.tenure.endedAt).format('DD MMM YYYY');
        const notification = new Notification();
        notification.title = daysLeft <= 1 ? 'Rent due tomorrow' : `Rent due in ${daysLeft} days`;
        notification.message = `Your rent for ${this.getPropertyName(occupant.tenure.propertyUnit)} is due on ${dueDate}.`;
        notification.type = NotificationType.RENT_DUE_REMINDER;
        notification.sourceReference = sourceReference;
        await this.entityManager.save(notification);

        await this.notificationTargetService.createForUser(notification, userId);
    }

    prepareMailData(occupant: PropertyUnitOccupant): RentDueReminderEmailTemplateData {
        const unit = occupant.tenure.propertyUnit;
        const endedAt = occupant.tenure.endedAt;
        const now = new Date();
        const daysLeft = Math.max(
            0,
            Math.round((dayjs(endedAt).startOf('day').valueOf() - dayjs(now).startOf('day').valueOf()) / 86_400_000),
        );

        return {
            occupantName: this.getOccupantName(occupant),
            propertyName: this.getPropertyName(unit),
            unitNumber: unit.unitNumber || '',
            dueDate: dayjs(endedAt).format('DD MMM YYYY'),
            daysLeft,
            dashboardLink: process.env.LOGIN_URL || 'https://telah.ng/auth/signin',
        };
    }

    private getPropertyName(unit: PropertyUnit): string {
        let property = unit.location;
        if (property.resolvedSupersets?.length) {
            property = property.resolvedSupersets.at(-1);
        }
        return property.name || '';
    }

    private getOccupantName(occupant: PropertyUnitOccupant): string {
        let title = occupant.title || '';
        if (title.length && !title.endsWith('.')) {
            title += '.';
        }
        return StringUtils.normalizeSpace(`${title} ${occupant.firstName} ${occupant.lastName}`);
    }

    prepareSmsMessage(occupant: PropertyUnitOccupant, daysLeft: number): string {
        const firstName = occupant.firstName || 'Tenant';
        const renewalDate = dayjs(occupant.tenure.endedAt).format('DD MMM YYYY');

        if (daysLeft >= 30) {
            return `TELAH: Dear ${firstName}, Your rent is due for renewal on ${renewalDate}. Please plan ahead to ensure a smooth renewal. Thank you.`;
        }

        if (daysLeft >= 7) {
            return `TELAH: Dear ${firstName}, Reminder! Your rent renewal is due in 7 days on ${renewalDate}. Please make arrangements for payment.`;
        }

        return `TELAH: Dear ${firstName}, Your rent renewal is due tomorrow, ${renewalDate}. Please complete your payment today to keep your tenancy active and avoid late renewal issues.`;
    }
}
