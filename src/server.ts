import { ConstructorFunction, createContainer, DIContainerModule } from "@matchmakerjs/di";
import { CachingKeyResolver, JwtValidator, RsaJwtSignatureValidator } from "@matchmakerjs/jwt-validator";
import { addGracefulShutdown, startServer } from "@matchmakerjs/matchmaker";
import { createCronModule } from "@matchmakerjs/matchmaker-cron";
import {
    applyMessageListeners,
    createKafkaConsumerModule,
    createKafkaProducerModule,
    MessageListener,
} from "@matchmakerjs/matchmaker-kafkajs";
import { createRedisModule } from "@matchmakerjs/matchmaker-redis";
import { RequestListenerWithActivityLog } from "@matchmakerjs/matchmaker-request-listener";
import { createTypeOrmModule } from "@matchmakerjs/matchmaker-typeorm";
import { ActivityLogProxyFactory } from "@matchmakerjs/typeorm-audit";
import { createClient, RedisClientType } from "@redis/client";
import { instanceToPlain } from "class-transformer";
import * as http from "node:http";
import * as firebase from "firebase-admin";
import { Kafka } from "kafkajs";
import { APP_NAME } from "./app/constants/app.constant";
import { BrevoClient } from "./app/integrations/email/brevo/brevo-client";
import { MailSender } from "./app/integrations/email/mail-sender";
import { MailgunClient } from "./app/integrations/email/mailgun/mailgun-client";
import { SendgridClient } from "./app/integrations/email/sendgrid/sendgrid-client";
import { createFirebaseApp, FIREBASE_APP } from "./app/integrations/firebase/firebase-conf";
import { FIRESTORE } from "./app/integrations/firebase/firestore-conf";
import { TwilioClient } from "./app/integrations/twilio/twilio-client";
import { startProducerQueueProcessors } from "./app/queue-processors/start-queue-processor";
import argumentListResolver from "./conf/argument-list-resolver";
import ormconfig from "./conf/ormconfig";
import router from "./conf/router";
import validator from "./conf/validator";
import { RequestContainerFactoryImpl } from "./request-container-factory";
import { BearerTokenAccessClaimsResolverWithCookieSupport } from "./security/access-claims-resolver";
import { RemoteKeyResolver } from "./security/remote-key-resolver";
import { TemplateEngine } from "./utils/template-engine";
import { HbsTemplateEngine } from "./utils/template-engine-impl";
import { listeners } from "./listeners";
import { WorkspaceControllerApi } from "./sdk/workspace-api-sdk";
import { DefaultingTenureLedgerInvoiceControllerApi } from "./sdk/ledger-api-sdk";
import axios from "axios";

const kafka = new Kafka({
    // clientId: 'my-app',
    brokers: (process.env.KAFKA_BOOTSTRAP_SERVERS || "localhost:9092")?.split(/ *, */),
});
const producer = kafka.producer();
const kafkaProducerModule = createKafkaProducerModule(producer);
const consumer = kafka.consumer({ groupId: APP_NAME });
const redisClient: RedisClientType = createClient({
    url: process.env.REDIS_SERVER_URL,
});
const firebaseApp = process.env.FIREBASE_CONFIG_FILE_PATH
    ? createFirebaseApp(process.env.FIREBASE_CONFIG_FILE_PATH)
    : {};

const axiosInstance = axios.create({
    headers: {
        "user-agent": APP_NAME,
    },
});

const moduleFactories = [createTypeOrmModule(ormconfig)];
Promise.all<DIContainerModule>(moduleFactories).then(async (modules) => {
    const [container, cleanUp] = createContainer({
        proxyFactory: ActivityLogProxyFactory,
        modules: [
            ...modules,
            createRedisModule(redisClient),
            createCronModule(),
            createKafkaConsumerModule(consumer),
            kafkaProducerModule,
            {
                providers: [
                    {
                        provide: MailSender,
                        with: () => {
                            if (process.env.BREVO_API_KEY) {
                                console.log("*** using Brevo as email server ***");
                                return new BrevoClient();
                            }
                            if (process.env.SENDGRID_API_KEY) {
                                console.log("*** using Sendgrid as email server ***");
                                return new SendgridClient();
                            }
                            if (process.env.MAILGUN_MESSAGES_API_KEY) {
                                console.log("*** using Mailgun as email server ***");
                                return new MailgunClient();
                            }
                            console.log("*** no email server configured ***");
                            return {
                                sendMail: console.log,
                            } as MailSender;
                        },
                    },
                    {
                        provide: TemplateEngine,
                        with: () => new HbsTemplateEngine(),
                    },
                    {
                        provide: FIREBASE_APP,
                        with: () => firebaseApp,
                    },
                    {
                        provide: FIRESTORE,
                        with: () => (firebaseApp as firebase.app.App).firestore?.(),
                    },
                    {
                        provide: TwilioClient,
                        with: () => {
                            const accountSid = process.env.TWILIO_ACCOUNT_SID;
                            const authToken = process.env.TWILIO_AUTH_TOKEN;

                            if (!accountSid || !authToken) {
                                console.log("*** using stub twilio client ***");
                                return {
                                    makeCall: (options) => {
                                        console.log(options);
                                        return Promise.resolve();
                                    },
                                    sendSms: (options) => {
                                        console.log(options);
                                        return Promise.resolve();
                                    },
                                } as TwilioClient;
                            }
                            return new TwilioClient({
                                accountSid,
                                authToken,
                            });
                        },
                    },
                    {
                        provide: WorkspaceControllerApi,
                        with: () => new WorkspaceControllerApi(null, process.env.WORKSPACE_API_BASE_URL, axiosInstance),
                    },
                    {
                        provide: DefaultingTenureLedgerInvoiceControllerApi,
                        with: () =>
                            new DefaultingTenureLedgerInvoiceControllerApi(
                                null,
                                process.env.LEDGER_API_BASE_URL,
                                axiosInstance,
                            ),
                    },
                ],
                isHealthy: () => Promise.resolve(true),
            },
        ],
    });

    try {
        startProducerQueueProcessors(container, redisClient, kafkaProducerModule);
        applyMessageListeners(
            consumer,
            listeners.map((it) => container.getInstance(it as ConstructorFunction<MessageListener>))
        );
        producer.connect().catch(console.error);
        consumer.connect().catch(console.error);
        redisClient.connect().catch(console.error);

        const keyResolver = new CachingKeyResolver(new RemoteKeyResolver(process.env.WEB_KEY_URL), {
            cacheSize: parseInt(process.env.WEB_KEY_CACHE_SIZE, 10),
        });
        const jwtValidator = new JwtValidator(
            new RsaJwtSignatureValidator(keyResolver),
            parseInt(process.env.JWT_CLOCK_SKEW_MS || "1000", 10)
        );

        const server = http.createServer(
            RequestListenerWithActivityLog(router, {
                container,
                argumentListResolver,
                validator,
                accessClaimsResolver: new BearerTokenAccessClaimsResolverWithCookieSupport(jwtValidator),
                serialize: (data: unknown) => JSON.stringify(instanceToPlain(data, { enableCircularCheck: true })),
                requestContainerFactory: new RequestContainerFactoryImpl(),
            })
        );
        addGracefulShutdown(server, cleanUp);
        startServer(server);
        process.on("unhandledRejection", (reason, _) => {
            console.error("unhandledRejection:", reason);
        });
    } catch (error) {
        console.error(error);
        cleanUp();
    }
});
