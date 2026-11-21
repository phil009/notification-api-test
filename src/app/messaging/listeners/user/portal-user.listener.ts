import { Injectable } from "@matchmakerjs/di";
import { MessageListener } from "@matchmakerjs/matchmaker-kafkajs";
import { Activity } from "@matchmakerjs/typeorm-audit";
import { EntityManager } from "typeorm";
import { UserAccountApiResponse } from "../../../../sdk/account-api-sdk";
import { USER_ACCOUNT_TOPIC } from "../../../constants/topics.constant";
import { PortalUser } from "../../../data/entities/external/portal-user.entity";
import { PortalUserRegistrationService } from "../../services/portal-user-registration.service";
import { TemplateEngine } from "../../../../utils/template-engine";
import { MailSender } from "../../../integrations/email/mail-sender";

@Injectable()
export class PortalUserMessageListener implements MessageListener {
    constructor(
        private entityManager: EntityManager,
        private portalUserService: PortalUserRegistrationService,
        private templateEngine: TemplateEngine,
        private mailSender: MailSender
    ) {}

    private async sendWelcomeEmail(userData: UserAccountApiResponse): Promise<void> {
        // Skip if no email address
        if (!userData.emailAddress) {
            console.log(`Skipping welcome email for user ${userData.userId}: No email address`);
            return;
        }

        // Skip if no display name (required by template)
        if (!userData.displayName) {
            console.log(`Skipping welcome email for user ${userData.userId}/${userData.emailAddress}: No display name`);
            return;
        }

        try {
            const response = await this.mailSender.sendMail({
                to: userData.emailAddress,
                subject: "Welcome to TELAH",
                html: await this.templateEngine.compile("welcome.html", {
                    displayName: userData.displayName,
                }),
            });
            console.log(this.getTopic(), "Welcome email sent to", userData.emailAddress, response);
        } catch (e) {
            console.error(`Failed to send welcome email to ${userData.emailAddress}:`, e);
            // Don't throw - allow user creation to succeed even if email fails
        }
    }

    @Activity("PORTAL USER NOTIFICATION")
    async processMessage(message: Buffer): Promise<void> {
        const dto: UserAccountApiResponse = JSON.parse(message.toString());
        console.log(`Received user ${dto.userId}/${dto.emailAddress}/${dto.emailAddressVerified}`);

        const entity = await this.entityManager.getRepository(PortalUser).findOne({ userId: dto.userId });
        if (!entity) {
            await this.portalUserService.createUser(dto);
            // email sends at this point
            await this.sendWelcomeEmail(dto);
        } else {
            await this.portalUserService.updateUser(entity, dto);
        }
    }

    getTopic(): string {
        return USER_ACCOUNT_TOPIC;
    }
}
