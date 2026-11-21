import { createContainer } from '@matchmakerjs/di';
import { REDIS, RedisLockService } from '@matchmakerjs/matchmaker-redis';
import { createTypeOrmModule, SqliteInMemoryConnectionOptions } from '@matchmakerjs/matchmaker-typeorm';
import { entities as auditEntities } from '@matchmakerjs/typeorm-audit';
import { AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';
import { EntityManager } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { MailSender } from '../src/app/integrations/email/mail-sender';
import { UnpaidBillReminderForTenureQueueProcessor } from '../src/app/queue-processors/unpaid-bill-reminder-for-tenure.queue';
import { OccupantApiResponseTypeEnum } from '../src/sdk/occupant-api-sdk';
import { SearchResultOfWorkspaceApiResponse, WorkspaceControllerApi } from '../src/sdk/workspace-api-sdk';
import { TemplateEngine } from '../src/utils/template-engine';
import { HbsTemplateEngine } from '../src/utils/template-engine-impl';
import { createAddress } from '../test/seeders/address.seeder';
import { createPropertyOwner } from '../test/seeders/property-owner.seeder';
import { createPropertyUnitOccupant } from '../test/seeders/property-unit-occupant.seeder';
import { createPropertyUnitTenure } from '../test/seeders/property-unit-tenure.seeder';
import { createPropertyUnit } from '../test/seeders/property-unit.seeder';
import { createProperty } from '../test/seeders/property.seeder';
import { createTenureLedger } from '../test/seeders/tenure-ledger.seeder';
import { createUser } from '../test/seeders/user.seeder';
import EmailClient from './mailler/client';
import * as faker from 'faker';
import { RedisClientType } from '@redis/client';

dotenv.config();
createTypeOrmModule(
    SqliteInMemoryConnectionOptions({
        namingStrategy: new SnakeNamingStrategy(),
        entities: [...auditEntities, 'src/app/data/entities/**/*.entity.ts'],
    }),
)
    .then((typeOrmModule) =>
        createContainer({
            modules: [
                typeOrmModule,
                {
                    providers: [
                        {
                            provide: RedisLockService,
                            with: () =>
                                ({
                                    execute: (key, fn) => fn(),
                                } as RedisLockService),
                        },
                        {
                            provide: TemplateEngine,
                            with: () => new HbsTemplateEngine(),
                        },
                        {
                            provide: MailSender,
                            with: () => new EmailClient(),
                        },
                        {
                            provide: MailSender,
                            with: () =>
                                ({
                                    sendMail: console.log,
                                } as MailSender),
                        },
                        {
                            provide: REDIS,
                            with: () =>
                                ({
                                    get: (_) => Promise.resolve(faker.internet.password()),
                                } as Partial<RedisClientType>),
                        },
                    ],
                    isHealthy: () => Promise.resolve(true),
                },
            ],
        }),
    )
    .then(async ([container, cleanUp]) => {
        try {
            const entityManager = container.getInstance(EntityManager);

            const user = await createUser({ entityManager, emailAddressVerified: true });

            const address = await createAddress({ entityManager });

            const propertyOwner = await createPropertyOwner({ entityManager });
            const property = await createProperty({ entityManager, address, owner: propertyOwner });
            const unit = await createPropertyUnit({ entityManager, location: property, unitNumber: '247' });
            const tenure = await createPropertyUnitTenure({ entityManager, unit });
            await createPropertyUnitOccupant({
                entityManager,
                tenure,
                user,
                type: OccupantApiResponseTypeEnum.Primary,
            });
            await createTenureLedger({
                entityManager,
                tenure,
                defaultedAt: new Date(),
                sumOfInvoicesIssued: 1100,
                sumOfPaymentsReceived: 98.88,
                currency: 'NGN',
            });

            const queueProcessor = container
                .clone([
                    {
                        provide: WorkspaceControllerApi,
                        with: () =>
                            ({
                                getWorkspaceForSystem: () =>
                                    Promise.resolve({
                                        data: {
                                            results: [
                                                {
                                                    id: propertyOwner.workspace.id,
                                                    realEstateCompany: {
                                                        emailAddress: faker.internet.email(),
                                                    },
                                                    bankAccounts: [
                                                        {
                                                            bank: {
                                                                name: faker.company.companyName(),
                                                                code: faker.company.companySuffix(),
                                                            },
                                                            accountName: faker.finance.accountName(),
                                                            accountNumber: faker.finance.account(),
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    } as AxiosResponse<SearchResultOfWorkspaceApiResponse, unknown>),
                            } as WorkspaceControllerApi),
                    },
                ])
                .getInstance(UnpaidBillReminderForTenureQueueProcessor);
            const itemsToProcess = await queueProcessor.fetchItems(10);
            console.log('processing', itemsToProcess.length, 'items(s)');
            for (const item of itemsToProcess) {
                await queueProcessor.processItem(item);
            }
            const itemsAfterProcessing = await queueProcessor.fetchItems(10);
            console.log(itemsAfterProcessing.length, 'items(s) left to process');
        } finally {
            cleanUp();
        }
    });
