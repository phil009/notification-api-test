# notification-api

## Start Standalone

### create .env
```
ENVIRONMENT=dev
SERVER_PORT=5000
SWAGGER_UI_PATH=src/swagger-ui.html
TYPEORM_ENTITIES=src/app/data/entities/**/*.entity.ts
DB_SCHEMA=auth_schema

# Optional configurations with default values
DB_HOST=127.0.0.1
DB_TYPE=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
```

### Start application and visit URL
`npm start` and open `http://127.0.0.1:5000`

## Start in Docker

### Create `docker-compose.yaml`

```
version: "3.8"

services:

  app-server:
    image: node:20-alpine
    restart: unless-stopped
    working_dir: /stage
    volumes:
      - ./:/stage
      - ./server/path/to/firebase-adminsdk.json:/google_service_account # change to the correct path in your environment
    entrypoint: 'npm start'
    environment:
      DB_HOST: "db"
      DB_SCHEMA: "${POSTGRES_DB-root}"
      DB_USERNAME: "${POSTGRES_USER-root}"
      DB_PASSWORD: "${POSTGRES_PASSWORD-postgres}"
      KAFKA_BOOTSTRAP_SERVERS: "kafka:9092"
      REDIS_SERVER_URL: redis://default:secret@redis:6379
      FIREBASE_CONFIG_FILE_PATH: /google_service_account
    ports:
      - "${SERVER_PORT-5000}:${SERVER_PORT-5000}"

  db:
    image: "postgres:13.4-alpine"
    restart: unless-stopped
    environment:
      POSTGRES_DB: "${POSTGRES_DB-root}"
      POSTGRES_USER: "${POSTGRES_USER-root}"
      POSTGRES_PASSWORD: "${POSTGRES_PASSWORD-postgres}"
    volumes:
      - ./server/postgresql:/var/lib/postgresql/data

  zookeeper:
    image: olaleye/kafka-zookeeper:2.12-2.5.0
    restart: unless-stopped
    volumes:
      - ./server/zookeeper:/tmp/zookeeper

  kafka:
    image: olaleye/kafka-broker:2.12-2.5.0
    restart: unless-stopped
    command: >
      --override broker.id=1 --override zookeeper.connect=zookeeper:2181

      --override listeners=INTERNAL://kafka:9000,EXTERNAL://:9092 --override advertised.listeners=INTERNAL://kafka:9000,EXTERNAL://kafka:9092

      --override inter.broker.listener.name=INTERNAL --override listener.security.protocol.map=INTERNAL:PLAINTEXT,EXTERNAL:PLAINTEXT
    environment:
      KAFKA_HEAP_OPTS: "-Xmx256M -Xms128M"
    volumes:
      - ./server/kafka-logs:/tmp/kafka-logs
    depends_on:
      - zookeeper
    
  redis:
    image: "redis:7.0.11-alpine"
    command: redis-server --requirepass secret
    healthcheck:
      test: [ "CMD", "redis-cli", "ping" ]
      interval: 30s
      timeout: 10s
      retries: 3
    environment:
      - REDIS_REPLICATION_MODE=master
```

### Start application and visit URL
`docker-compose up` and open `http://127.0.0.1:5000`

### Generate sdk
```
rm -rf ${PWD}/src/sdk/auth-api-sdk && docker run --rm -v ${PWD}/src/sdk/auth-api-sdk:/out/ olaleye/openapi-generator-cli:5.1.1 generate -i http://host.docker.internal:4444/authentication-api/v3/api-docs -g typescript-axios -o /out

rm -rf ${PWD}/src/sdk/rbac-api-sdk && docker run --rm -v ${PWD}/src/sdk/rbac-api-sdk:/out/ olaleye/openapi-generator-cli:5.1.1 generate -i http://host.docker.internal:4444/rbac-api/v3/api-docs -g typescript-axios -o /out

rm -rf ${PWD}/src/sdk/account-api-sdk && docker run --rm -v ${PWD}/src/sdk/account-api-sdk:/out/ olaleye/openapi-generator-cli:5.1.1 generate -i http://host.docker.internal:4444/account-api/v3/api-docs -g typescript-axios -o /out

rm -rf ${PWD}/src/sdk/payment-api-sdk && docker run --rm -v ${PWD}/src/sdk/payment-api-sdk:/out/ olaleye/openapi-generator-cli:5.1.1 generate -i http://host.docker.internal:4444/payment-api/v3/api-docs -g typescript-axios --additional-properties=useSingleRequestParameter=true -o /out

rm -rf ${PWD}/src/sdk/reference-data-api-sdk && docker run --rm -v ${PWD}/src/sdk/reference-data-api-sdk:/out/ olaleye/openapi-generator-cli:5.1.1 generate -i http://host.docker.internal:4444/reference-data-api/v3/api-docs -g typescript-axios -o /out

rm -rf ${PWD}/src/sdk/ledger-api-sdk && docker run --rm -v ${PWD}/src/sdk/ledger-api-sdk:/out/ olaleye/openapi-generator-cli:5.1.1 generate -i http://host.docker.internal:4444/ledger-api/v3/api-docs -g typescript-axios --additional-properties=useSingleRequestParameter=true -o /out

rm -rf ${PWD}/src/sdk/vending-api-sdk && docker run --rm -v ${PWD}/src/sdk/vending-api-sdk:/out/ olaleye/openapi-generator-cli:5.1.1 generate -i http://host.docker.internal:4444/vending-api/v3/api-docs -g typescript-axios -o /out

rm -rf ${PWD}/src/sdk/property-api-sdk && docker run --rm -v ${PWD}/src/sdk/property-api-sdk:/out/ olaleye/openapi-generator-cli:5.1.1 generate -i http://host.docker.internal:4444/property-api/v3/api-docs -g typescript-axios -o /out

rm -rf ${PWD}/src/sdk/occupant-api-sdk && docker run --rm -v ${PWD}/src/sdk/occupant-api-sdk:/out/ olaleye/openapi-generator-cli:5.1.1 generate -i http://host.docker.internal:4444/occupant-api/v3/api-docs -g typescript-axios -o /out

rm -rf ${PWD}/src/sdk/workspace-api-sdk && docker run --rm -v ${PWD}/src/sdk/workspace-api-sdk:/out/ olaleye/openapi-generator-cli:5.1.1 generate -i http://host.docker.internal:4444/workspace-api/v3/api-docs -g typescript-axios --additional-properties=useSingleRequestParameter=true -o /out
```

## Build docker image
`npm run tsc && api-doc --input ./src/conf/router.ts --out ./openapi.json && docker-image --from 'node:20-alpine' --copy 'dist' --copy 'static/:static/' --copy src/swagger-ui.html ---copy openapi.json --platform linux/amd64 -t olaleye/telah-notification-api:prod && docker push olaleye/telah-notification-api:prod`

`npm run tsc && api-doc --input ./src/conf/router.ts --out ./openapi.json && docker-image --from 'node:20-alpine' --copy 'dist' --copy 'static/:static/' --copy src/swagger-ui.html ---copy openapi.json --platform linux/amd64 -t olaleye/telah-notification-api:test && docker push olaleye/telah-notification-api:test`
