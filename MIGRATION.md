# dev_scripts/docker-compose.yaml
```
version: '3'
services:
  postgres:
    image: "postgres:12.2-alpine"
    ports:
      - "5433:5432"
    environment:
      POSTGRES_USER: "postgres"
      POSTGRES_PASSWORD: "postgres"
      POSTGRES_DB: "migration"
```

# dev_scripts/migration.env
```
ENVIRONMENT=migration
DB_TYPE=postgres
DB_HOST=127.0.0.1
DB_PORT=5433
DB_SCHEMA=migration
DB_USERNAME=postgres
DB_PASSWORD=postgres
# TYPEORM_ENTITIES = node_modules/@matchmakerjs/typeorm-audit/dist/data/entity/*.js
TYPEORM_ENTITIES = src/app/data/entities/*.ts
```

## Migration
`npm run typeorm -- migration:generate -n $migrationName -p`