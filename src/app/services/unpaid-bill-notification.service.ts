import { Inject, Injectable } from "@matchmakerjs/di";
import { REDIS } from "@matchmakerjs/matchmaker-redis";
import { RedisClientType } from "@redis/client";
import { Transactional } from "@matchmakerjs/typeorm-audit";
import { BigNumber } from "bignumber.js";
import dayjs from "dayjs";
import { EntityManager } from "typeorm";
import {
    DefaultingTenureLedgerInvoiceControllerApi,
    TenureLedgerApiResponseTypeEnum,
} from "../../sdk/ledger-api-sdk";
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
import { MailAttachment } from "../integrations/email/mail-sender";
import { NotificationDao } from "../dao/notification.dao";
import { Notification } from "../data/entities/notification.entity";
import { NotificationType } from "../data/enums/notification-type.enum";
import { NotificationTargetService } from "./notification-target.service";
import { TenureLedger } from "../data/entities/external/ledger/tenure/tenure-ledger.entity";
import { PropertyUnit } from "../data/entities/external/property/property-unit.entity";
import { Property } from "../data/entities/external/property/property.entity";
import { PropertyUnitOccupant } from "../data/entities/external/tenure/property-unit-occupant.entity";

export type BillLineItem = {
    label: string;
    amount: string;
};

export type TenantInvoiceEmailTemplateData = {
    workspaceId: string;
    occupantName: string;
    currency?: string;
    amount: string;
    lineItems: BillLineItem[];
    unitAddress: string;
    propertyManagerBankName: string;
    propertyManagerBankAccountName: string;
    propertyManagerBankAccountNumber: string;
    propertyManagerEmailAddress: string;
    propertyManagerName: string;
    workspaceLogoUrl?: string;
};

const LEDGER_TYPE_LABELS: Record<string, string> = {
    [TenureLedgerApiResponseTypeEnum.Rent]: "Rent",
    [TenureLedgerApiResponseTypeEnum.ServiceCharge]: "Service Charge",
    [TenureLedgerApiResponseTypeEnum.CautionFee]: "Caution Fee",
    [TenureLedgerApiResponseTypeEnum.AdministrativeFee]: "Administrative Fee",
};

@Injectable()
export class UnpaidBillNotificationService {
    constructor(
        private workspaceControllerApi: WorkspaceControllerApi,
        private defaultingTenureLedgerInvoiceControllerApi: DefaultingTenureLedgerInvoiceControllerApi,
        @Inject(REDIS) private redisClient: RedisClientType,
        private entityManager: EntityManager,
        private notificationDao: NotificationDao,
        private notificationTargetService: NotificationTargetService,
    ) {}

    /**
     * Adds the in-app (and push) counterpart of the outstanding-bill email. It is keyed on the
     * occupant and calendar day, matching the reminder's 2-day cadence, so a retry within the same
     * day never duplicates it.
     */
    @Transactional()
    async createOverdueBillNotification(
        occupant: PropertyUnitOccupant,
        emailData: TenantInvoiceEmailTemplateData,
        now: Date,
    ): Promise<void> {
        const userId = occupant.user?.userId;
        if (!userId) return;

        const sourceReference = `${occupant.id}:${dayjs(now).format(
            "YYYY-MM-DD",
        )}`;
        const existing = await this.notificationDao.findNotificationBySource({
            type: NotificationType.TENURE_BILL_OVERDUE,
            sourceReference,
        });
        if (existing) return;

        const amount = `${emailData.currency || ""}${emailData.amount}`;
        const notification = new Notification();
        notification.title = `Outstanding payment of ${amount}`;
        notification.message = `You have an outstanding bill of ${amount} at ${emailData.unitAddress}. Please make payment as soon as possible.`;
        notification.type = NotificationType.TENURE_BILL_OVERDUE;
        notification.sourceReference = sourceReference;
        await this.entityManager.save(notification);

        await this.notificationTargetService.createForUser(
            notification,
            userId,
        );
    }

    async prepareMailData(
        occupant: PropertyUnitOccupant,
        ledgersWithOutstanding: TenureLedger[],
    ): Promise<TenantInvoiceEmailTemplateData> {
        const unit = occupant.tenure.propertyUnit;

        const workspaceData = await this.getWorkspaceData(unit.location);

        if (!workspaceData) {
            return;
        }

        const bankAccount = workspaceData.bankAccounts[0];
        const currency = this.getCurrencySymbol(
            ledgersWithOutstanding[0].currency,
        );

        return {
            workspaceId: workspaceData.id,
            unitAddress: this.getAddressAsString(unit),
            occupantName: this.getOccupantName(occupant),
            currency,
            amount: this.sumOutstanding(ledgersWithOutstanding).toFormat(
                2,
                BigNumber.ROUND_CEIL,
            ),
            lineItems: this.getLineItems(ledgersWithOutstanding, currency),
            propertyManagerName: workspaceData.name,
            propertyManagerEmailAddress:
                this.getWorkspaceEmailAddress(workspaceData),
            propertyManagerBankName: bankAccount?.bank?.name,
            propertyManagerBankAccountName: bankAccount?.accountName,
            propertyManagerBankAccountNumber: bankAccount?.accountNumber,
            workspaceLogoUrl: workspaceData.logoUrl || undefined,
        };
    }

    /**
     * Fetches the tenant's invoice PDF from the ledger service, so it can be attached to the
     * outstanding-bill email. Best-effort: returns undefined (never throws) on any failure, so a
     * PDF-fetch problem never blocks the email itself from sending.
     */
    async prepareInvoiceAttachment(
        workspaceId: string,
        tenureId: string,
    ): Promise<MailAttachment | undefined> {
        try {
            const response =
                await this.defaultingTenureLedgerInvoiceControllerApi.getDefaultingTenureInvoice(
                    workspaceId,
                    tenureId,
                    {
                        responseType: "arraybuffer",
                        headers: {
                            [X_SECRET_KEY]: await this.redisClient.get(
                                AUTHENTICATION_API_SECRET_KEY_NAME,
                            ),
                        },
                    },
                );
            const content = Buffer.from(response.data as ArrayBuffer);
            // Guard against silently attaching a non-PDF body (e.g. a JSON error page) if the
            // endpoint's actual response shape ever turns out not to be raw PDF bytes.
            if (content.subarray(0, 4).toString("ascii") !== "%PDF") {
                console.error(
                    `Defaulting tenure invoice for tenure ${tenureId} was not a PDF; not attaching`,
                );
                return;
            }
            return {
                filename: "invoice.pdf",
                content,
                contentType: "application/pdf",
            };
        } catch (error) {
            console.error(
                `Failed to fetch invoice PDF for tenure ${tenureId}`,
                error,
            );
            return;
        }
    }

    private sumOutstanding(ledgersWithOutstanding: TenureLedger[]): BigNumber {
        return ledgersWithOutstanding
            .filter((it) => it.outstanding)
            .map((it) => new BigNumber(it.outstanding))
            .reduce((prev, cur) => prev.plus(cur), new BigNumber(0));
    }

    private getLineItems(
        ledgersWithOutstanding: TenureLedger[],
        currency: string,
    ): BillLineItem[] {
        const totalsByType = new Map<string, BigNumber>();
        for (const ledger of ledgersWithOutstanding) {
            if (!ledger.outstanding) continue;
            const key = ledger.type || "OTHER";
            totalsByType.set(
                key,
                (totalsByType.get(key) || new BigNumber(0)).plus(
                    new BigNumber(ledger.outstanding),
                ),
            );
        }
        return [...totalsByType.entries()].map(([type, total]) => ({
            label:
                LEDGER_TYPE_LABELS[type] ||
                StringUtils.normalizeSpace(type.replace(/_/g, " ")),
            amount: `${currency}${total.toFormat(2, BigNumber.ROUND_CEIL)}`,
        }));
    }

    private getWorkspaceEmailAddress(workspaceData: WorkspaceApiResponse) {
        let workspaceEmailAddress = workspaceData.contactDetails?.find(
            (it) =>
                it.contactType ===
                WorkspaceContactDetailApiResponseContactTypeEnum.EmailAddress,
        )?.contact;

        if (!workspaceEmailAddress) {
            if (workspaceData.type === WorkspaceApiResponseTypeEnum.Realtor) {
                workspaceEmailAddress =
                    workspaceData.realEstateCompany?.emailAddress;
            }
            if (workspaceData.type === WorkspaceApiResponseTypeEnum.Landlord) {
                workspaceEmailAddress = workspaceData.landlord.emailAddress;
            }
        }
        return workspaceEmailAddress;
    }

    private getAddressAsString(unit: PropertyUnit) {
        let property = unit.location;
        if (property.resolvedSupersets?.length) {
            property = property.resolvedSupersets.at(-1);
        }
        const address = property.address;
        let unitNumber = unit.unitNumber || "";
        if (unitNumber.length) {
            unitNumber = `Unit ${unitNumber},`;
        }
        const state = address.lga?.state;
        const unitAddress = StringUtils.normalizeSpace(
            `${unitNumber} ${address.streetAddress}, ${address.city}, ${
                state?.name || ""
            }`,
        );
        return unitAddress;
    }

    private getCurrencySymbol(currencyCode: string): string {
        const symbols: Record<string, string> = { NGN: "₦" };
        return symbols[currencyCode] ?? currencyCode;
    }

    private getOccupantName(occupant: PropertyUnitOccupant) {
        let title = occupant.title || "";
        if (title.length && !title.endsWith(".")) {
            title += ".";
        }
        const occupantName = StringUtils.normalizeSpace(
            `${title} ${occupant.firstName} ${occupant.lastName}`,
        );
        return occupantName;
    }

    private async getWorkspaceData(property: Property) {
        if (property.resolvedSupersets?.length) {
            property = property.resolvedSupersets.at(-1);
        }
        const workspace = property.owner?.workspace || property.workspace;
        if (!workspace) {
            return Promise.reject(`No workspace for property ${property.id}`);
        }
        const workspaceId = workspace.id;
        const response =
            await this.workspaceControllerApi.getWorkspaceForSystem(
                {
                    workspaceId: [workspaceId],
                },
                {
                    headers: {
                        [X_SECRET_KEY]: await this.redisClient.get(
                            AUTHENTICATION_API_SECRET_KEY_NAME,
                        ),
                    },
                },
            );
        const workspaceData = response.data.results.find(
            (it) => it.id === workspaceId,
        );
        if (!workspaceData) {
            return Promise.reject(
                `Workspace data for ${workspaceId} could not be retrieved`,
            );
        }
        return workspaceData;
    }
}
