import { Injectable } from "@matchmakerjs/di";
import { EntityManager, SelectQueryBuilder } from "typeorm";
import { OfflinePaymentApiResponseStatusEnum } from "../../sdk/ledger-api-sdk";
import { OccupantApiResponseTypeEnum } from "../../sdk/occupant-api-sdk";
import { DateUtils } from "../../utils/date-util";
import { TenureLedger } from "../data/entities/external/ledger/tenure/tenure-ledger.entity";
import { TenurePayment } from "../data/entities/external/ledger/tenure/tenure-payment.entity";
import { PropertyOwner } from "../data/entities/external/property/property-owner.entity";
import { PropertyUnit } from "../data/entities/external/property/property-unit.entity";
import { Property } from "../data/entities/external/property/property.entity";
import { PropertyUnitOccupant } from "../data/entities/external/tenure/property-unit-occupant.entity";
import { PropertyUnitTenure } from "../data/entities/external/tenure/property-unit-tenure.entity";
import { Workspace } from "../data/entities/external/workspace/workspace.entity";
import { Notification } from "../data/entities/notification.entity";
import { NotificationType } from "../data/enums/notification-type.enum";
import dayjs from "dayjs";

const CHUNK_SIZE = 500;

@Injectable()
export class PortfolioSummaryDao {
    constructor(private entityManager: EntityManager) {}

    /** Active workspaces whose summary for the given period (e.g. `2026-09`) hasn't been sent or isn't being sent. */
    getWorkspacesWithoutSummary(
        period: string,
        limit: number,
        skipIds?: string[],
    ): Promise<Workspace[]> {
        const qb = this.entityManager
            .createQueryBuilder(Workspace, "w")
            .where("w.deactivatedAt IS NULL");

        const staleBefore = dayjs().subtract(10, "minute").toDate();

        const handled = qb
            .subQuery()
            .select("1")
            .from(Notification, "n")
            .where("n.type = :summaryType")
            .andWhere(
                `n.sourceReference = CAST(w.id AS text) || ':' || :period`,
            )
            // sent, or claimed recently enough that another run is probably still on it
            .andWhere(
                "(n.notificationSentAt IS NOT NULL OR n.sendClaimedAt > :staleBefore)",
            );
        qb.andWhere(`NOT EXISTS ${handled.getQuery()}`, {
            summaryType: NotificationType.MONTHLY_PORTFOLIO_SUMMARY,
            period,
            staleBefore,
        });

        if (skipIds?.length) {
            qb.andWhere("w.id NOT IN (:...skipIds)", { skipIds });
        }
        return qb.orderBy("w.id").limit(limit).getMany();
    }

    getUnits(workspaceId: string): Promise<PropertyUnit[]> {
        const qb = this.entityManager
            .createQueryBuilder(PropertyUnit, "pu")
            .innerJoinAndSelect("pu.location", "l");
        this.scopeToWorkspace(qb, workspaceId);
        return qb.getMany();
    }

    getActiveTenures(
        workspaceId: string,
        now: Date,
    ): Promise<PropertyUnitTenure[]> {
        const qb = this.entityManager
            .createQueryBuilder(PropertyUnitTenure, "t")
            .innerJoinAndSelect("t.propertyUnit", "pu")
            .innerJoin("pu.location", "l")
            .where("t.deactivatedAt IS NULL")
            .andWhere("(t.startedAt IS NULL OR t.startedAt <= :now)")
            .andWhere("(t.endedAt IS NULL OR t.endedAt > :now)")
            .setParameter("now", DateUtils.toSql(now));
        this.scopeToWorkspace(qb, workspaceId);
        return qb.getMany();
    }

    /** Ledgers past their default date, with the tenure and unit they belong to. */
    getDefaultedLedgers(
        workspaceId: string,
        now: Date,
    ): Promise<TenureLedger[]> {
        const qb = this.entityManager
            .createQueryBuilder(TenureLedger, "tl")
            .innerJoinAndSelect("tl.tenure", "t")
            .innerJoinAndSelect("t.propertyUnit", "pu")
            .innerJoin("pu.location", "l")
            .where("tl.defaultedAt <= :now")
            .setParameter("now", DateUtils.toSql(now));
        this.scopeToWorkspace(qb, workspaceId);
        return qb.getMany();
    }

    getPaymentsReceived(
        workspaceId: string,
        from: Date,
        to: Date,
    ): Promise<TenurePayment[]> {
        const qb = this.entityManager
            .createQueryBuilder(TenurePayment, "tp")
            .leftJoin("tp.offlinePayment", "op")
            .innerJoin("tp.tenureLedger", "tl")
            .innerJoin("tl.tenure", "t")
            .innerJoin("t.propertyUnit", "pu")
            .innerJoin("pu.location", "l")
            .where("tp.deactivatedAt IS NULL")
            .andWhere("tp.createdAt >= :from")
            .andWhere("tp.createdAt < :to")
            .andWhere("(op.id IS NULL OR op.status = :accepted)")
            .setParameters({
                from: DateUtils.toSql(from),
                to: DateUtils.toSql(to),
                accepted: OfflinePaymentApiResponseStatusEnum.Accepted,
            });
        this.scopeToWorkspace(qb, workspaceId);
        return qb.getMany();
    }

    async getPrimaryOccupants(
        tenureIds: string[],
    ): Promise<PropertyUnitOccupant[]> {
        const result: PropertyUnitOccupant[] = [];
        for (let i = 0; i < tenureIds.length; i += CHUNK_SIZE) {
            const chunk = tenureIds.slice(i, i + CHUNK_SIZE);
            result.push(
                ...(await this.entityManager
                    .createQueryBuilder(PropertyUnitOccupant, "o")
                    .innerJoinAndSelect("o.tenure", "t")
                    .where("t.id IN (:...chunk)", { chunk })
                    .andWhere("o.type = :primary", {
                        primary: OccupantApiResponseTypeEnum.Primary,
                    })
                    .getMany()),
            );
        }
        return result;
    }

    /**
     * Restricts a query to one workspace's units. Requires the query to have joined the unit as `pu`
     * and its property as `l`. A unit belongs to the workspace of its root property's owner (or its
     * own property's owner), falling back to the property's workspace when there is no owner — the
     * same rule the manager emails already use to find a workspace.
     */
    private scopeToWorkspace<T>(
        qb: SelectQueryBuilder<T>,
        workspaceId: string,
    ) {
        qb.leftJoin(
            Property,
            "p_root",
            "p_root.deactivatedAt IS NULL AND p_root.supersets IS NULL AND p_root.id = ANY(l.supersets)",
        );
        qb.leftJoin(
            PropertyOwner,
            "po",
            "po.deactivatedAt IS NULL AND (p_root.owner=po.id OR l.owner=po.id)",
        );
        qb.andWhere("pu.deactivatedAt IS NULL AND l.deactivatedAt IS NULL");
        qb.andWhere(
            "(po.workspace = :workspaceId OR (po.id IS NULL AND l.workspace = :workspaceId))",
            {
                workspaceId,
            },
        );
    }
}
