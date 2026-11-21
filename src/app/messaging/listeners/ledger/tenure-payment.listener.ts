import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity, Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { TenurePaymentApiResponse } from '../../../../sdk/ledger-api-sdk';
import { TemplateEngine } from '../../../../utils/template-engine';
import { TENURE_PAYMENT_TOPIC } from '../../../constants/topics.constant';
import { TenurePayment } from '../../../data/entities/external/ledger/tenure/tenure-payment.entity';
import { MailSender } from '../../../integrations/email/mail-sender';
import { PropertyUnitTenurePaymentService } from '../../services/ledger/tenure-payment.service';

@Injectable()
export class PropertyUnitTenurePaymentMessageListener implements MessageListener {
    constructor(
        private entityManager: EntityManager,
        private propertyUnitTenurePaymentService: PropertyUnitTenurePaymentService,
        private mailSender: MailSender,
        private templateEngine: TemplateEngine,
    ) {}

    @Activity('PROPERTY UNIT TENURE PAYMENT NOTIFICATION')
    @Transactional()
    async processMessage(message: Buffer): Promise<void> {
        const dto: TenurePaymentApiResponse = JSON.parse(message.toString());

        const tenurePayment = await this.entityManager.getRepository(TenurePayment).findOne({
            withDeleted: true,
            where: { id: dto.id },
        });

        let payment: TenurePayment;
        let isNewManagerNotification: boolean;
        let tenureLedger;

        if (!tenurePayment) {
            const result = await this.propertyUnitTenurePaymentService.create(dto);
            payment = result.payment;
            isNewManagerNotification = result.isNewManagerNotification;
            tenureLedger = result.tenureLedger;
        } else {
            const result = await this.propertyUnitTenurePaymentService.update(tenurePayment, dto);
            payment = tenurePayment;
            isNewManagerNotification = result.isNewManagerNotification;
            tenureLedger = result.tenureLedger;
        }

        if (isNewManagerNotification) {
            try {
                const emailData = await this.propertyUnitTenurePaymentService.prepareManagerEmailData(
                    payment,
                    dto,
                    tenureLedger,
                );
                if (emailData) {
                    await this.mailSender.sendMail({
                        to: emailData.managerEmail,
                        subject: 'Payment Recorded',
                        html: await this.templateEngine.compile('tenure-payment-recorded.html', emailData),
                    });
                }
            } catch (error) {
                console.error(`Failed to send tenure payment email for payment ${dto.id}`, error);
            }
        }
    }

    getTopic(): string {
        return TENURE_PAYMENT_TOPIC;
    }
}
