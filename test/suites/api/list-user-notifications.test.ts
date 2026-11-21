import { createContainer, LazyDIContainer } from '@matchmakerjs/di';
import { JwtClaims } from '@matchmakerjs/jwt-validator';
import { createTypeOrmModule, SqliteInMemoryConnectionOptions } from '@matchmakerjs/matchmaker-typeorm';
import { Authorizer } from '@matchmakerjs/rbac-client';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';
import { TestServer } from '../../conf/test-server';

describe('notification list', () => {
    let cleanUp: () => Promise<void>;
    let container: LazyDIContainer;
    const assertPermission = jest.fn();

    beforeAll(async () => {
        dotenv.config();
        await createTypeOrmModule(SqliteInMemoryConnectionOptions()).then(async (typeOrmModule) => {
            [container, cleanUp] = createContainer({
                modules: [
                    typeOrmModule,
                    {
                        isHealthy: () => Promise.resolve(true),
                        providers: [
                            {
                                provide: Authorizer,
                                with: () =>
                                    ({
                                        assertPermission,
                                    } as Partial<Authorizer>),
                            },
                        ],
                    },
                ],
            });
        });
    });

    afterAll(async () => cleanUp && cleanUp());

    afterEach(() => jest.resetAllMocks());

    it('should list empty notification', async () => {
        const userId = randomUUID();
        const response = await TestServer(container, {
            sub: userId,
        } as JwtClaims).get(`/me/notifications`);
        expect(response?.statusCode).toBe(200);
    });
});
