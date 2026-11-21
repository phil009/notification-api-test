import { ConstructorFunction } from '@matchmakerjs/di';
import { entities as auditEntities, PersistenceSubscriber, WebRequest } from '@matchmakerjs/typeorm-audit';
import { ConnectionOptions, EntitySchema } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

const entities: (ConstructorFunction<unknown> | string | EntitySchema<unknown>)[] = [];

if (process.env.ENVIRONMENT === 'migration') {
    entities.push(...(process.env.TYPEORM_ENTITIES || '').split(/, */));
} else {
    entities.push(
        WebRequest,
        ...auditEntities,
        process.env.ENVIRONMENT === 'dev' ? 'src/app/data/entities/**/*.ts' : 'app/data/entities/**/*.js',
    );
}

export default {
    type: (process.env.DB_TYPE || 'postgres') as unknown,
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_URL || process.env.DB_SCHEMA,
    synchronize: process.env.ENVIRONMENT === 'dev',
    logging: false,
    entities: entities,
    migrations: [
        process.env.ENVIRONMENT === 'dev' || process.env.ENVIRONMENT === 'migration'
            ? 'src/migrations/**/*.ts'
            : 'migrations/**/*.js',
    ],
    migrationsRun: process.env.ENVIRONMENT !== 'dev',
    subscribers: [
        // "src/listener/**/*.ts",
        PersistenceSubscriber,
    ],
    cli: {
        entitiesDir: 'src/app/data/entities',
        migrationsDir: 'src/migrations',
        subscribersDir: 'src/listener',
    },
    bigNumberStrings: false,
    extra: {
        max: 4,
        // connectionTimeoutMillis: 1000
    },
    namingStrategy: new SnakeNamingStrategy(),
} as ConnectionOptions;
