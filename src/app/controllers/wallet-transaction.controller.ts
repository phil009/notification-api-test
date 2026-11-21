import { ErrorResponse, Get, PathParameter, Query, QueryParameter, RestController } from '@matchmakerjs/matchmaker';
import { RequestMetadata } from '@matchmakerjs/matchmaker-security';
import { isDateString } from 'class-validator';
import { WalletTransactionApiResponseStatusEnum } from '../../sdk/payment-api-sdk';
import { WalletTransactionDao } from '../dao/wallet-transaction.dao';
import { PageRequest } from '../data/dto/requests/page-request';
import { SearchResult } from '../data/dto/responses/search-result';
import { NotificationApiWalletTransactionApiResponse } from '../data/dto/responses/payment/wallet-transaction.response';

@RestController()
export class WalletTransactionController {
    constructor(
        private requestMetadata: RequestMetadata,
        private walletTransactionDao: WalletTransactionDao,
    ) {}

    @Get('/me/wallet-transactions')
    async getCurrentUserWalletTransactions(
        @Query() page: PageRequest,
        @QueryParameter('notBefore') notBefore: string,
        @QueryParameter('before') before: string,
    ): Promise<SearchResult<NotificationApiWalletTransactionApiResponse>> {
        const limit = PageRequest.getLimit(page.limit, 10, 100);
        const offset = PageRequest.getOffset(page.offset);

        if ((before && !isDateString(before)) || (notBefore && !isDateString(notBefore))) {
            throw new ErrorResponse(400, {
                message: 'Invalid date string',
            });
        }

        const qb = this.walletTransactionDao.createQuery({
            userId: this.requestMetadata.userId,
            status: [WalletTransactionApiResponseStatusEnum.Successful],
            loadAddress: true,
            notBefore: notBefore && new Date(notBefore),
            before: before && new Date(before),
        });

        const entities = await this.walletTransactionDao.fetchResults(qb.clone().distinct(), {
            limit,
            offset,
        });
        const results = entities.map((it) => NotificationApiWalletTransactionApiResponse.fromEntity(it));
        let total = PageRequest.computeTotal(limit, offset, results.length);
        if (typeof total !== 'number') {
            ({ total } = await qb.clone().select('count(DISTINCT e.id)', 'total').getRawOne());
            total = Number(total);
        }
        return { limit, offset, total, results };
    }

    @Get('/workspaces/:workspaceId/wallet-transactions')
    async getWorkspaceWalletTransactions(
        @PathParameter('workspaceId') workspaceId: string,
        @Query() page: PageRequest,
        @QueryParameter('notBefore') notBefore: string,
        @QueryParameter('before') before: string,
        @QueryParameter('walletId') walletId: string[],
    ): Promise<SearchResult<NotificationApiWalletTransactionApiResponse>> {
        const limit = PageRequest.getLimit(page.limit, 10, 100);
        const offset = PageRequest.getOffset(page.offset);

        if ((before && !isDateString(before)) || (notBefore && !isDateString(notBefore))) {
            throw new ErrorResponse(400, {
                message: 'Invalid date string',
            });
        }

        const qb = this.walletTransactionDao.createQuery({
            workspaceId,
            walletId,
            status: [WalletTransactionApiResponseStatusEnum.Successful],
            loadAddress: true,
            notBefore: notBefore && new Date(notBefore),
            before: before && new Date(before),
        });

        const entities = await this.walletTransactionDao.fetchResults(qb.clone().distinct(), {
            limit,
            offset,
        });
        // await this.propertyService.loadForUnits(
        //     entities.map((it) => it.splitPayment?.propertyUnitRegistrationBill?.propertyUnit),
        // );
        const results = entities.map((it) => NotificationApiWalletTransactionApiResponse.fromEntity(it));
        let total = PageRequest.computeTotal(limit, offset, results.length);
        if (typeof total !== 'number') {
            ({ total } = await qb.clone().select('count(DISTINCT e.id)', 'total').getRawOne());
            total = Number(total);
        }
        return { limit, offset, total, results };
    }
}
