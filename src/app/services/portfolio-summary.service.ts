import { Inject, Injectable } from "@matchmakerjs/di";
import { REDIS } from "@matchmakerjs/matchmaker-redis";
import { RedisClientType } from "@redis/client";
import { BigNumber } from "bignumber.js";
import dayjs from "dayjs";
import { EntityManager } from "typeorm";
import {
    WorkspaceApiResponse,
    WorkspaceApiResponseTypeEnum,
    WorkspaceContactDetailApiResponseContactTypeEnum,
    WorkspaceControllerApi,
} from "../../sdk/workspace-api-sdk";
import { StringUtils } from "../../utils/string.util";
import {
    AUTHENTICATION_API_SECRET_KEY_NAME,
    X_SECRET_KEY,
} from "../constants/app.constant";
import { PortfolioSummaryDao } from "../dao/portfolio-summary.dao";
import { TenureLedgerDao } from "../dao/tenure-ledger.dao";
import { PropertyUnit } from "../data/entities/external/property/property-unit.entity";
import { PropertyUnitOccupant } from "../data/entities/external/tenure/property-unit-occupant.entity";
import { PropertyUnitTenure } from "../data/entities/external/tenure/property-unit-tenure.entity";
import { Workspace } from "../data/entities/external/workspace/workspace.entity";
import { Notification } from "../data/entities/notification.entity";
import { NotificationType } from "../data/enums/notification-type.enum";
import { PropertyEnrichmentService } from "./property-enrichment.service";

const EXPIRING_WINDOW_DAYS = 90;
const LIST_LIMIT = 10;
const CHUNK_SIZE = 500;
const DAY_MS = 86_400_000;

export type PortfolioSummaryRow = {
    unit?: string;
    tenantName?: string;
    endDate?: string;
    daysLeft?: number;
    amount?: string;
    daysOverdue?: number;
};

export type PortfolioSummaryEmailData = {
    managerEmail: string;
    propertyManagerName: string;
    monthLabel: string;
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
    occupancyRate: string;
    hasRentCollected: boolean;
    rentCollected: string[];
    expiringCount: number;
    expiring: PortfolioSummaryRow[];
    expiringMore: number;
    vacantCount: number;
    vacant: PortfolioSummaryRow[];
    vacantMore: number;
    debtorCount: number;
    debtors: PortfolioSummaryRow[];
    debtorsMore: number;
};

export type PortfolioSummary = Omit<
    PortfolioSummaryEmailData,
    "managerEmail" | "propertyManagerName"
>;

@Injectable()
export class PortfolioSummaryService {
    constructor(
        private entityManager: EntityManager,
        private portfolioSummaryDao: PortfolioSummaryDao,
        private tenureLedgerDao: TenureLedgerDao,
        private propertyEnrichmentService: PropertyEnrichmentService,
        private workspaceControllerApi: WorkspaceControllerApi,
        @Inject(REDIS) private redisClient: RedisClientType,
    ) {}

    getPeriod(now: Date): string {
        return dayjs(now).format("YYYY-MM");
    }

    findWorkspacesToNotify(
        now: Date,
        limit: number,
        skip?: Workspace[],
    ): Promise<Workspace[]> {
        return this.portfolioSummaryDao.getWorkspacesWithoutSummary(
            this.getPeriod(now),
            limit,
            skip?.map((it) => it.id),
        );
    }

    async claim(
        workspace: Workspace,
        now: Date,
    ): Promise<Notification | undefined> {
        // No notification target is attached, so this never surfaces in-app or as a push. It exists
        // only so the unique (type, sourceReference) rule stops the same month being sent twice.
        const type = NotificationType.MONTHLY_PORTFOLIO_SUMMARY;
        const sourceReference = `${workspace.id}:${this.getPeriod(now)}`;
        const repo = this.entityManager.getRepository(Notification);

        //create notification if it doesn't exist
        await repo
            .createQueryBuilder()
            .insert()
            .values({
                title: "Monthly portfolio summary",
                type,
                sourceReference,
            })
            .orIgnore()
            .execute();

        const notification = await repo.findOneOrFail({
            type,
            sourceReference,
        });
        if (notification.notificationSentAt) return;

        const staleBefore = dayjs(now).subtract(10, "minute").toDate();
        const result = await repo
            .createQueryBuilder()
            .update()
            .set({ sendClaimedAt: now })
            .where("id = :id", { id: notification.id })
            .andWhere('"notificationSentAt" IS NULL')
            .andWhere(
                '"sendClaimedAt" IS NULL OR sendClaimedAt < :staleBefore',
                {
                    staleBefore,
                },
            )
            .execute();
        return result.affected ? notification : undefined;
    }

    async markSent(notification: Notification): Promise<void> {
        await this.entityManager.update(Notification, notification.id, {
            notificationSentAt: new Date(),
        });
    }

    async release(notification: Notification): Promise<void> {
        await this.entityManager.update(Notification, notification.id, {
            sendClaimedAt: null,
        });
    }

    async buildSummary(
        workspace: Workspace,
        now: Date,
    ): Promise<PortfolioSummary> {
        const units = await this.portfolioSummaryDao.getUnits(workspace.id);
        await this.propertyEnrichmentService.loadForUnits(units);
        const unitLabels = new Map(
            units.map((it) => [it.id, this.getUnitLabel(it)]),
        );

        const tenures = await this.portfolioSummaryDao.getActiveTenures(
            workspace.id,
            now,
        );
        const occupiedUnitIds = new Set(
            tenures.map((it) => it.propertyUnit.id),
        );
        const vacantUnits = units.filter((it) => !occupiedUnitIds.has(it.id));

        const expiringTenures = tenures
            .filter(
                (it) =>
                    it.endedAt &&
                    it.endedAt.getTime() > now.getTime() &&
                    it.endedAt.getTime() <=
                        now.getTime() + EXPIRING_WINDOW_DAYS * DAY_MS,
            )
            .sort((a, b) => a.endedAt.getTime() - b.endedAt.getTime());

        const debtors = await this.getDebtors(workspace.id, now);

        const tenantNames = await this.getTenantNames(
            expiringTenures.map((it) => it.id),
        );

        const monthStart = dayjs(now).startOf("month").toDate();
        const monthEnd = dayjs(now).startOf("month").add(1, "month").toDate();
        const rentCollected = await this.getRentCollected(
            workspace.id,
            monthStart,
            monthEnd,
        );

        const totalUnits = units.length;
        const occupiedUnits = units.length - vacantUnits.length;

        return {
            monthLabel: dayjs(now).format("MMMM YYYY"),
            totalUnits,
            occupiedUnits,
            vacantUnits: vacantUnits.length,
            occupancyRate: totalUnits
                ? `${Math.round((occupiedUnits / totalUnits) * 100)}%`
                : "0%",
            hasRentCollected: rentCollected.length > 0,
            rentCollected,
            expiringCount: expiringTenures.length,
            expiring: expiringTenures.slice(0, LIST_LIMIT).map((it) => ({
                unit: unitLabels.get(it.propertyUnit.id) || "",
                tenantName: tenantNames.get(it.id),
                endDate: dayjs(it.endedAt).format("DD MMM YYYY"),
                daysLeft: Math.max(
                    0,
                    Math.ceil((it.endedAt.getTime() - now.getTime()) / DAY_MS),
                ),
            })),
            expiringMore: Math.max(0, expiringTenures.length - LIST_LIMIT),
            vacantCount: vacantUnits.length,
            vacant: vacantUnits
                .map((it) => ({ unit: unitLabels.get(it.id) || "" }))
                .sort((a, b) => a.unit.localeCompare(b.unit))
                .slice(0, LIST_LIMIT),
            vacantMore: Math.max(0, vacantUnits.length - LIST_LIMIT),
            debtorCount: debtors.length,
            debtors: debtors.slice(0, LIST_LIMIT).map((it) => ({
                tenantName: it.tenantName || "Unknown tenant",
                amount: it.amount,
                daysOverdue: it.daysOverdue,
            })),
            debtorsMore: Math.max(0, debtors.length - LIST_LIMIT),
        };
    }

    async prepareEmailData(
        workspace: Workspace,
        summary: PortfolioSummary,
    ): Promise<PortfolioSummaryEmailData | undefined> {
        const workspaceData = await this.getWorkspaceData(workspace.id);
        const managerEmail =
            workspaceData && this.getWorkspaceEmailAddress(workspaceData);
        if (!managerEmail) return;

        return {
            ...summary,
            managerEmail,
            propertyManagerName: workspaceData.name||"",
        };
    }

    private async getDebtors(workspaceId: string, now: Date) {
        const defaultedLedgers =
            await this.portfolioSummaryDao.getDefaultedLedgers(
                workspaceId,
                now,
            );
        const unitByTenure = new Map(
            defaultedLedgers.map((it) => [
                it.tenure.id,
                it.tenure.propertyUnit.id,
            ]),
        );
        const tenures = [...unitByTenure.keys()].map(
            (id) => ({ id } as PropertyUnitTenure),
        );

        const outstanding = [];
        for (let i = 0; i < tenures.length; i += CHUNK_SIZE) {
            outstanding.push(
                ...(await this.tenureLedgerDao.getOutstandingByTenures(
                    tenures.slice(i, i + CHUNK_SIZE),
                    now,
                )),
            );
        }
        const byTenure = new Map<
            string,
            {
                unitId: string;
                tenantName: string;
                tenureId: string;
                totals: Map<string, BigNumber>;
                defaultedAt: Date;
            }
        >();
        for (const ledger of outstanding) {
            if (
                !ledger.defaultedAt ||
                ledger.defaultedAt.getTime() > now.getTime()
            )
                continue;
            const tenureId = ledger.tenure.id;
            const entry = byTenure.get(tenureId) || {
                unitId: unitByTenure.get(tenureId),
                tenantName: "",
                tenureId,
                totals: new Map<string, BigNumber>(),
                defaultedAt: ledger.defaultedAt,
            };
            entry.totals.set(
                ledger.currency,
                (entry.totals.get(ledger.currency) || new BigNumber(0)).plus(
                    new BigNumber(String(ledger.outstanding)),
                ),
            );
            if (ledger.defaultedAt.getTime() < entry.defaultedAt.getTime())
                entry.defaultedAt = ledger.defaultedAt;
            byTenure.set(tenureId, entry);
        }

        return [...byTenure.values()]
            .map((it) => ({
                unitId: it.unitId,
                tenureId: it.tenureId,
                tenantName: it.tenantName,
                amount: this.formatTotals(it.totals).join(" + "),
                daysOverdue: Math.max(
                    0,
                    Math.ceil(
                        (now.getTime() - it.defaultedAt.getTime()) / DAY_MS,
                    ),
                ),
            }))
            .sort((a, b) => b.daysOverdue - a.daysOverdue);
    }

    private async getRentCollected(
        workspaceId: string,
        from: Date,
        to: Date,
    ): Promise<string[]> {
        const payments = await this.portfolioSummaryDao.getPaymentsReceived(
            workspaceId,
            from,
            to,
        );
        const totals = new Map<string, BigNumber>();
        for (const payment of payments) {
            totals.set(
                payment.currency,
                (totals.get(payment.currency) || new BigNumber(0)).plus(
                    new BigNumber(String(payment.amount)),
                ),
            );
        }
        return this.formatTotals(totals);
    }

    private async getTenantNames(
        tenureIds: string[],
    ): Promise<Map<string, string>> {
        const occupants: PropertyUnitOccupant[] =
            await this.portfolioSummaryDao.getPrimaryOccupants([
                ...new Set(tenureIds),
            ]);
        return new Map(
            occupants.map((it) => [it.tenure.id, this.getOccupantName(it)]),
        );
    }

    private formatTotals(totals: Map<string, BigNumber>): string[] {
        return [...totals.entries()].map(
            ([currency, total]) =>
                `${this.getCurrencySymbol(currency)}${total.toFormat(
                    2,
                    BigNumber.ROUND_CEIL,
                )}`,
        );
    }

    private getUnitLabel(unit: PropertyUnit): string {
        let property = unit.location;
        if (property?.resolvedSupersets?.length) {
            property = property.resolvedSupersets.at(-1);
        }
        const name = property?.name || "";
        const unitNumber = unit.unitNumber ? `Unit ${unit.unitNumber}` : "";
        return StringUtils.normalizeSpace(
            [name, unitNumber].filter(Boolean).join(" - "),
        );
    }

    private getOccupantName(occupant: PropertyUnitOccupant): string {
        let title = occupant.title || "";
        if (title.length && !title.endsWith(".")) {
            title += ".";
        }
        return StringUtils.normalizeSpace(
            `${title} ${occupant.firstName || ""} ${occupant.lastName || ""}`,
        );
    }

    private getCurrencySymbol(currencyCode: string): string {
        const symbols: Record<string, string> = { NGN: "₦" };
        return symbols[currencyCode] ?? currencyCode;
    }

    private getWorkspaceEmailAddress(
        workspaceData: WorkspaceApiResponse,
    ): string {
        let email = workspaceData.contactDetails?.find(
            (it) =>
                it.contactType ===
                WorkspaceContactDetailApiResponseContactTypeEnum.EmailAddress,
        )?.contact;

        if (!email) {
            if (workspaceData.type === WorkspaceApiResponseTypeEnum.Realtor) {
                email = workspaceData.realEstateCompany?.emailAddress;
            }
            if (workspaceData.type === WorkspaceApiResponseTypeEnum.Landlord) {
                email = workspaceData.landlord?.emailAddress;
            }
        }
        return email;
    }

    private async getWorkspaceData(
        workspaceId: string,
    ): Promise<WorkspaceApiResponse | undefined> {
        const response =
            await this.workspaceControllerApi.getWorkspaceForSystem(
                { workspaceId: [workspaceId] },
                {
                    headers: {
                        [X_SECRET_KEY]: await this.redisClient.get(
                            AUTHENTICATION_API_SECRET_KEY_NAME,
                        ),
                    },
                },
            );
        return response.data.results.find((it) => it.id === workspaceId);
    }
}
