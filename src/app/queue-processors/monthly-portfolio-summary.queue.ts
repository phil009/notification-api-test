import { DIContainerModule, Injectable } from "@matchmakerjs/di";
import { QueueEngine, QueueProcessor } from "@matchmakerjs/matchmaker-cron";
import { RedisLockService } from "@matchmakerjs/matchmaker-redis";
import { RedisClientType } from "@redis/client";
import dayjs from "dayjs";
import { TemplateEngine } from "../../utils/template-engine";
import { Workspace } from "../data/entities/external/workspace/workspace.entity";
import { MailSender } from "../integrations/email/mail-sender";
import { PortfolioSummaryService } from "../services/portfolio-summary.service";

@Injectable()
export class MonthlyPortfolioSummaryQueueProcessor
    implements QueueProcessor<Workspace>
{
    constructor(
        private portfolioSummaryService: PortfolioSummaryService,
        private mailSender: MailSender,
        private templateEngine: TemplateEngine,
    ) {}

    async fetchItems(
        maxResults: number,
        skip?: Workspace[],
    ): Promise<Workspace[]> {
        const now = new Date();
        // The task runs on every hour of the last days of the month so a failed send is retried,
        // but the report only goes out on the month's final day.
        if (dayjs(now).add(1, "day").date() !== 1) return [];
        return this.portfolioSummaryService.findWorkspacesToNotify(
            now,
            maxResults,
            skip,
        );
    }

    async processItem(workspace: Workspace): Promise<void> {
        const now = new Date();
        const notification = await this.portfolioSummaryService.claim(
            workspace,
            now,
        );
        if (!notification) return; // already sent, or another run is on it

        try {
            const summary = await this.portfolioSummaryService.buildSummary(
                workspace,
                now,
            );

            if (!summary.totalUnits) {
                await this.portfolioSummaryService.markSent(notification);
                return;
            }

            const emailData =
                await this.portfolioSummaryService.prepareEmailData(
                    workspace,
                    summary,
                );
            if (!emailData) {
                console.warn(
                    `No contact email for workspace ${workspace.id}; skipping monthly portfolio summary`,
                );
                await this.portfolioSummaryService.markSent(notification);
                return;
            }

            await this.mailSender.sendMail({
                to: emailData.managerEmail,
                subject: `Monthly Portfolio Summary - ${emailData.monthLabel}`,
                html: await this.templateEngine.compile(
                    "monthly-portfolio-summary.html",
                    emailData,
                ),
            });
            await this.portfolioSummaryService.markSent(notification);
        } catch (error) {
            await this.portfolioSummaryService.release(notification); // let the next hourly run retry
            console.error(
                `Failed to send monthly portfolio summary for workspace ${workspace.id}`,
                error,
            );
            throw error;
        }
    }

    createTask(
        redisClient: RedisClientType,
        lockService: RedisLockService,
        containerModule: DIContainerModule,
    ) {
        return async () => {
            const now = Date.now();
            const latestKey = "monthly-portfolio-summary:latest";
            await redisClient.set(latestKey, now);
            await lockService.execute(
                "monthly-portfolio-summary:active",
                async () => {
                    const canContinue = async () =>
                        (await containerModule.isHealthy()) &&
                        (await redisClient.get(latestKey)) === now.toString();
                    if (!(await canContinue())) return;
                    await QueueEngine.processQueue(this, canContinue, 10);
                },
                { secondsTillExpiry: 300 },
            );
        };
    }
}
