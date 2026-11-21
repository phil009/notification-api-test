import { LazyDIContainer } from '@matchmakerjs/di';
import { RequestContainerFactory, RequestContext } from '@matchmakerjs/matchmaker-request-listener';
import { RbacClient } from '@matchmakerjs/rbac-client';
import axios, { AxiosRequestHeaders } from 'axios';
import { IncomingHttpHeaders } from 'http';
import { APP_NAME } from './app/constants/app.constant';
import { AXIOS_INSTANCE } from './app/constants/axios.constant';
import { UserDetailsControllerApi } from './sdk/account-api-sdk';
import { UserIdentifierVerificationControllerApi } from './sdk/auth-api-sdk';
import { UserMembershipControllerApi } from './sdk/rbac-api-sdk';

export class RequestContainerFactoryImpl implements RequestContainerFactory {
    createContainer(rootContainer: LazyDIContainer, context: RequestContext): LazyDIContainer {
        return rootContainer.clone([
            {
                provide: AXIOS_INSTANCE,
                with: () => {
                    const headers = {
                        'x-request-id': context.webRequest.requestId,
                        'user-agent': APP_NAME,
                    } as IncomingHttpHeaders & AxiosRequestHeaders;
                    if (context.claims) {
                        headers.authorization = context.request.headers.authorization;
                    }
                    return axios.create({ headers });
                },
            },
            {
                provide: UserMembershipControllerApi,
                with: (di) =>
                    new UserMembershipControllerApi(null, process.env.RBAC_API_BASE_URL, di.get(AXIOS_INSTANCE)),
            },
            {
                provide: RbacClient,
                with: (di) => new RbacClient(di.getInstance(UserMembershipControllerApi)),
            },
            {
                provide: UserIdentifierVerificationControllerApi,
                with: (di) =>
                    new UserIdentifierVerificationControllerApi(
                        null,
                        process.env.AUTH_API_BASE_URL,
                        di.get(AXIOS_INSTANCE),
                    ),
            },
            {
                provide: UserDetailsControllerApi,
                with: (di) =>
                    new UserDetailsControllerApi(null, process.env.ACCOUNT_API_BASE_URL, di.get(AXIOS_INSTANCE)),
            },
        ]);
    }
}
