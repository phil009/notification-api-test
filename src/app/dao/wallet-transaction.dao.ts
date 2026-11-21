import { Injectable } from '@matchmakerjs/di';
import { Brackets, EntityManager, SelectQueryBuilder } from 'typeorm';
import {
    WalletTransactionApiResponseSourceEnum,
    WalletTransactionApiResponseStatusEnum
} from '../../sdk/payment-api-sdk';
import { DateUtils } from '../../utils/date-util';
import { CustomerWallet } from '../data/entities/external/payment/customer-wallet.entity';
import { WalletTransaction } from '../data/entities/external/payment/wallet-transaction.entity';

type CreateQueryOptions = {
    workspaceId?: string;
    propertyUnitId?: string;
    tenureId?: string;
    userId?: string;
    status?: WalletTransactionApiResponseStatusEnum[];
    qb?: SelectQueryBuilder<WalletTransaction>;
    loadAddress: boolean;
    notBefore?: Date;
    before?: Date;
    walletId?: string[];
};

@Injectable()
export class WalletTransactionDao {
    constructor(private entityManager: EntityManager) { }

    createQuery(
        { userId, workspaceId, status, notBefore, before, walletId, qb: _qb }: CreateQueryOptions,
        alias = 'e',
    ) {
        const qb = _qb || this.entityManager.createQueryBuilder(WalletTransaction, alias);
        qb.innerJoinAndSelect(`${alias}.wallet`, `${alias}_w`);
        // qb.leftJoinAndSelect(`${alias}_w.propertyOwner`, `${alias}_po`);

        qb.leftJoinAndSelect(`${alias}.electricityUnitPurchase`, `${alias}_eup`);
        qb.leftJoinAndSelect(`${alias}_eup.meter`, `${alias}_eup_m`);
        qb.leftJoinAndSelect(`${alias}_eup_m.provider`, `${alias}_eup_mp`);

        qb.leftJoinAndSelect(`${alias}.splitPayment`, `${alias}_sp`);

        // qb.leftJoinAndSelect(`${alias}_sp.propertyUnitRegistrationBill`, `${alias}_urb`);
        // qb.leftJoinAndSelect(`${alias}_urb.propertyUnit`, `${alias}_urb_pu`);
        // qb.leftJoinAndSelect(`${alias}_urb_pu.location`, `${alias}_urb_l`);
        // qb.leftJoinAndSelect(`${alias}_urb_l.address`, `${alias}_address`);
        // qb.leftJoinAndSelect(`${alias}_address.lga`, `${alias}_lga`);
        // qb.leftJoinAndSelect(`${alias}_lga.state`, `${alias}_state`);
        // qb.leftJoinAndSelect(`${alias}_state.country`, `${alias}_country`);

        qb.leftJoinAndSelect(`${alias}_sp.propertyUnitSubscriptionPayment`, `${alias}_pus_p`);
        qb.leftJoinAndSelect(`${alias}_pus_p.propertyUnitSubscriptionLedger`, `${alias}_pus_l`);
        qb.leftJoinAndSelect(`${alias}_pus_l.propertyOwner`, `${alias}_pus_po`);

        // qb.leftJoinAndSelect(`${alias}.propertyUnitSubscriptionPayment`, `${alias}_usp`);
        // qb.leftJoinAndSelect(`${alias}_usp.propertyUnitSubscriptionLedger`, `${alias}_usp_l`);
        // qb.leftJoinAndSelect(`${alias}_usp_l.propertyOwner`, `${alias}_usp_po`);

        if (userId) {
            qb.innerJoin(CustomerWallet, `${alias}_cw`, `${alias}_cw.wallet=${alias}_w.id`)
                .innerJoin(`${alias}_cw.customer`, `${alias}_c`)
                .andWhere(`${alias}_c.user = :userId`, { userId });
        }

        if (workspaceId) {
            qb.innerJoin(CustomerWallet, `${alias}_cw`, `${alias}_cw.wallet=${alias}_w.id`)
                .innerJoin(`${alias}_cw.customer`, `${alias}_c`)
                .andWhere(`${alias}_c.workspace = :workspaceId`, { workspaceId });
        }

        if (notBefore) {
            qb.andWhere(`${alias}.createdAt >= :notBefore`, { notBefore: DateUtils.toSql(notBefore) });
        }
        if (before) {
            qb.andWhere(`${alias}.createdAt < :before`, { before: DateUtils.toSql(before) });
        }

        if (status?.length) {
            qb.andWhere(`${alias}.status IN (:...status)`, { status });
        }

        if (walletId?.length) {
            qb.andWhere(`${alias}_w.id IN (:...walletId)`, { walletId });
        }

        qb.andWhere(
            new Brackets((q) =>
                q
                    .where(`${alias}.source != :EXTERNAL_SOURCE`)
                    .orWhere(`${alias}_eup.id IS NOT NULL`)
                    // .orWhere(`${alias}_urb.id IS NOT NULL`)
                    .orWhere(`${alias}_pus_p.id IS NOT NULL`),
            ),
            {
                EXTERNAL_SOURCE: WalletTransactionApiResponseSourceEnum.External,
            },
        );

        return qb;
    }

    async fetchResults(
        qb: SelectQueryBuilder<WalletTransaction>,
        {
            limit,
            offset,
        }: {
            limit: number;
            offset?: number;
            order?: string[];
        },
        alias = 'e',
    ) {
        qb.addOrderBy(`${alias}.createdAt`, 'DESC');
        return qb
            .limit(limit)
            .offset(offset || 0)
            .getMany();
    }
}
