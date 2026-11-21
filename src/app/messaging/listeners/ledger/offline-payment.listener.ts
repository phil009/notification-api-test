import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { OfflinePaymentApiResponse } from '../../../../sdk/ledger-api-sdk';
import { TemplateEngine } from '../../../../utils/template-engine';
import { OFFLINE_PAYMENT_TOPIC } from '../../../constants/topics.constant';
import { OfflinePayment } from '../../../data/entities/external/ledger/offline-payment.entity';
import { MailSender } from '../../../integrations/email/mail-sender';
import { OfflinepaymentService } from '../../services/ledger/offline-payment.service';

@Injectable()
export class OfflinePaymentMessageListener implements MessageListener {
    constructor(
        private offlinePaymentService: OfflinepaymentService,
        private entityManager: EntityManager,
        private mailSender: MailSender,
        private templateEngine: TemplateEngine,
    ) {}

    @Activity('PROCESS OFFLINE PAYMENT NOTIFICATION')
    async processMessage(message: Buffer): Promise<void> {
        const dto: OfflinePaymentApiResponse = JSON.parse(message.toString());

        const entity = await this.entityManager.getRepository(OfflinePayment).findOne(dto.id.toString(), {
            relations: ['notification'],
        });

        let payment: OfflinePayment;
        let isNewNotification: boolean;
        let isNewReportNotification: boolean;
        let workspace;

        if (!entity) {
            const result = await this.offlinePaymentService.create(dto);
            payment = result.payment;
            isNewNotification = result.isNewNotification;
            isNewReportNotification = result.isNewReportNotification;
            workspace = result.workspace;
        } else if (entity.audit.version <= dto.version) {
            const result = await this.offlinePaymentService.update(entity, dto);
            payment = entity;
            isNewNotification = result.isNewNotification;
            isNewReportNotification = result.isNewReportNotification;
            workspace = result.workspace;
        } else {
            return;
        }

        if (isNewReportNotification && workspace) {
            try {
                const emailData = await this.offlinePaymentService.prepareManagerEmailData(payment, workspace);
                if (emailData) {
                    await this.mailSender.sendMail({
                        to: emailData.managerEmail,
                        subject: 'Payment Reported - Awaiting Your Review',
                        html: await this.templateEngine.compile('offline-payment-reported.html', emailData),
                    });
                }
            } catch (error) {
                console.error(`Failed to send offline payment report email for payment ${dto.id}`, error);
            }
        }

        if (isNewNotification && workspace) {
            try {
                const emailData = await this.offlinePaymentService.prepareTenantEmailData(payment, workspace);
                if (emailData) {
                    await this.mailSender.sendMail({
                        to: emailData.tenantEmail,
                        subject: `Payment ${emailData.status}`,
                        html: await this.templateEngine.compile('offline-payment-reviewed.html', emailData),
                    });
                }
            } catch (error) {
                console.error(`Failed to send offline payment review email for payment ${dto.id}`, error);
            }
        }
    }

    getTopic(): string {
        return OFFLINE_PAYMENT_TOPIC;
    }
}
