import { MigrationInterface, QueryRunner } from 'typeorm';

export class notifications1682961656104 implements MigrationInterface {
    name = 'notifications1682961656104';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "country" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "code" character varying NOT NULL,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_bf6e37c231c4f4ea56dcd887269" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "state" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "code" character varying NOT NULL,
                "country_id" uuid NOT NULL,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_549ffd046ebab1336c3a8030a12" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "lga" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "code" character varying NOT NULL,
                "state_id" uuid,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_732755837379a4fff12c6b0f412" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "address" (
                "id" SERIAL NOT NULL,
                "city" character varying NOT NULL,
                "postal_code" character varying,
                "street_address" character varying,
                "landmark" character varying,
                "country_id" uuid,
                "lga_id" uuid,
                CONSTRAINT "PK_d92de1f82754668b5f5f5dd4fd5" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "app_session" (
                "id" character varying NOT NULL,
                "user_id" character varying NOT NULL,
                "identifier" character varying,
                "authentication_type" character varying NOT NULL,
                "started_at" TIMESTAMP NOT NULL,
                "ended_at" TIMESTAMP,
                "expires_at" TIMESTAMP NOT NULL,
                "last_seen_at" TIMESTAMP,
                "application_id" character varying NOT NULL,
                "application_version" character varying NOT NULL,
                "firebase_token" character varying NOT NULL,
                CONSTRAINT "PK_187a3ca47eeeef55990a73447b9" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "wallet" (
                "id" uuid NOT NULL,
                "currency" character varying NOT NULL,
                "balance" numeric,
                "balance_last_updated_at" TIMESTAMP,
                "sum_of_queued_debit_transactions" numeric,
                "customer_user_id" character varying,
                "workspace_id" uuid,
                "property_owner_id" uuid,
                "is_free_credit" boolean,
                "expires_at" TIMESTAMP,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_bec464dd8d54c39c54fd32e2334" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "wallet_transaction" (
                "id" uuid NOT NULL,
                "currency" character varying NOT NULL,
                "amount" numeric NOT NULL,
                "type" character varying NOT NULL,
                "source" character varying NOT NULL,
                "status" character varying NOT NULL,
                "started_at" TIMESTAMP,
                "ended_at" TIMESTAMP,
                "wallet_balance_at_start" numeric,
                "wallet_id" uuid,
                "notification_id" uuid,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_62a01b9c3a734b96a08c621b371" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "electricity_meter_provider" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "vendor" character varying NOT NULL,
                "provider_id" character varying NOT NULL,
                "name" character varying NOT NULL,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_62e1fa82ddd7e7a0159d99e41a5" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "electricity_meter" (
                "id" uuid NOT NULL,
                "meter_number" character varying NOT NULL,
                "meter_name" character varying,
                "address" character varying,
                "phone_number" character varying,
                "provider_id" uuid,
                "customer_user_id" character varying,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_0c25085bcf7475bc920f56a4215" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "electricity_unit_purchase" (
                "id" uuid NOT NULL,
                "request_reference" character varying NOT NULL,
                "phone_number" character varying NOT NULL,
                "currency" character varying NOT NULL,
                "amount" numeric NOT NULL,
                "service_charge" numeric NOT NULL,
                "status" character varying NOT NULL,
                "started_at" TIMESTAMP,
                "ended_at" TIMESTAMP,
                "failure_type" character varying,
                "service_token" character varying,
                "allocated_units" character varying,
                "service_amount" numeric,
                "vat" numeric,
                "debt" numeric,
                "receipt_number" character varying,
                "meter_id" uuid,
                "wallet_transaction_id" uuid,
                "notification_id" uuid,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "UQ_f556369e592bf0be1ad1d5b3ee7" UNIQUE ("request_reference"),
                CONSTRAINT "UQ_367164b92b186ff5c4546d5a429" UNIQUE ("receipt_number"),
                CONSTRAINT "PK_01e517e32af2c75576c66a790a2" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "workspace" (
                "id" uuid NOT NULL,
                "name" character varying NOT NULL,
                "type" character varying NOT NULL,
                "has_logo" boolean,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_ca86b6f9b3be5fe26d307d09b49" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "property_unit_type" (
                "id" uuid NOT NULL,
                "name" character varying NOT NULL,
                "description" character varying,
                "workspace_id" uuid NOT NULL,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_b35070a4b5c34537681fbc93b00" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "property_unit" (
                "id" uuid NOT NULL,
                "unit_number" character varying,
                "reference_code" character varying,
                "type_id" uuid NOT NULL,
                "address_id" integer,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "REL_c986b38f9f38fab6c4f130b310" UNIQUE ("address_id"),
                CONSTRAINT "PK_709ee9f48a228162c82fcfaed31" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "property_unit_tenure" (
                "id" uuid NOT NULL,
                "start_date" date,
                "property_unit_id" uuid NOT NULL,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "last_unpaid_bill_notification_at" TIMESTAMP,
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_9b8b0528469f64651a93144baaa" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "tenure_service_charge" (
                "id" uuid NOT NULL,
                "invoice_number" character varying,
                "currency" character varying NOT NULL,
                "amount" numeric NOT NULL,
                "status" character varying NOT NULL,
                "service_started_at" TIMESTAMP,
                "service_ended_at" TIMESTAMP,
                "tenure_id" uuid NOT NULL,
                "notification_id" uuid,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_1f288b104481be07f7471a96c97" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "notification" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "version" integer NOT NULL,
                "title" character varying NOT NULL,
                "message" character varying,
                "type" character varying NOT NULL,
                "source_reference" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "UQ_c8858d01fe1f0fe88a38c5a9acf" UNIQUE ("type", "source_reference"),
                CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "notification_recipient" (
                "id" SERIAL NOT NULL,
                "version" integer NOT NULL,
                "user_id" character varying NOT NULL,
                "first_viewed_at" TIMESTAMP,
                "last_viewed_at" TIMESTAMP,
                "view_count" integer,
                "published_to_firebase_at" TIMESTAMP,
                "firebase_message_id" character varying,
                "push_notification_app_session_id" character varying,
                "notification_id" uuid NOT NULL,
                CONSTRAINT "UQ_9ef3a98d26422be6d6e74492d1b" UNIQUE ("notification_id", "user_id"),
                CONSTRAINT "PK_9830357f52360a126737d498e66" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "notification_target" (
                "id" SERIAL NOT NULL,
                "type" character varying NOT NULL,
                "user_id" character varying,
                "workspace_id" uuid,
                "role" character varying,
                "permission" character varying,
                "tenure_id" uuid,
                "occupant_type" character varying,
                "notification_id" uuid,
                CONSTRAINT "PK_67db04f1efe4aceebe092a1bbdf" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "named_record" (
                "id" uuid NOT NULL,
                "name" character varying NOT NULL,
                "description" character varying,
                "code" character varying,
                "display_picture_url" character varying,
                "type" character varying NOT NULL,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_4652cf05baf94560a4c3a6cb832" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "named_record_relationship" (
                "id" SERIAL NOT NULL,
                "distance" integer,
                "target_id" uuid NOT NULL,
                "source_id" uuid NOT NULL,
                CONSTRAINT "PK_364d97fb303adf52b427b287878" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "property_unit_occupant" (
                "id" uuid NOT NULL,
                "type" character varying NOT NULL,
                "user_id" character varying,
                "title" character varying,
                "first_name" character varying,
                "last_name" character varying,
                "phone_number" character varying,
                "email_address" character varying,
                "tenure_id" uuid NOT NULL,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_9fc74eb9ad0d6fa5202322158ce" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "wallet_transaction"
            ADD CONSTRAINT "FK_ba06035843fe7d6220eabeb8e83" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "electricity_unit_purchase"
            ADD CONSTRAINT "FK_e0a7d303b2fbdf5c455a2d9db55" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "property_unit"
            ADD CONSTRAINT "FK_c986b38f9f38fab6c4f130b3107" FOREIGN KEY ("address_id") REFERENCES "address"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "tenure_service_charge"
            ADD CONSTRAINT "FK_68f99c6a7dbb4374e432d60cf16" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "notification_recipient"
            ADD CONSTRAINT "FK_f6ebcb1bb7f7f55e33cf8488065" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "notification_target"
            ADD CONSTRAINT "FK_842009f58f4e99b8c9aee425d9e" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "notification_target" DROP CONSTRAINT "FK_842009f58f4e99b8c9aee425d9e"
        `);
        await queryRunner.query(`
            ALTER TABLE "notification_recipient" DROP CONSTRAINT "FK_f6ebcb1bb7f7f55e33cf8488065"
        `);
        await queryRunner.query(`
            ALTER TABLE "tenure_service_charge" DROP CONSTRAINT "FK_68f99c6a7dbb4374e432d60cf16"
        `);
        await queryRunner.query(`
            ALTER TABLE "property_unit" DROP CONSTRAINT "FK_c986b38f9f38fab6c4f130b3107"
        `);
        await queryRunner.query(`
            ALTER TABLE "electricity_unit_purchase" DROP CONSTRAINT "FK_e0a7d303b2fbdf5c455a2d9db55"
        `);
        await queryRunner.query(`
            ALTER TABLE "wallet_transaction" DROP CONSTRAINT "FK_ba06035843fe7d6220eabeb8e83"
        `);
        await queryRunner.query(`
            DROP TABLE "property_unit_occupant"
        `);
        await queryRunner.query(`
            DROP TABLE "named_record_relationship"
        `);
        await queryRunner.query(`
            DROP TABLE "named_record"
        `);
        await queryRunner.query(`
            DROP TABLE "notification_target"
        `);
        await queryRunner.query(`
            DROP TABLE "notification_recipient"
        `);
        await queryRunner.query(`
            DROP TABLE "notification"
        `);
        await queryRunner.query(`
            DROP TABLE "tenure_service_charge"
        `);
        await queryRunner.query(`
            DROP TABLE "property_unit_tenure"
        `);
        await queryRunner.query(`
            DROP TABLE "property_unit"
        `);
        await queryRunner.query(`
            DROP TABLE "property_unit_type"
        `);
        await queryRunner.query(`
            DROP TABLE "workspace"
        `);
        await queryRunner.query(`
            DROP TABLE "electricity_unit_purchase"
        `);
        await queryRunner.query(`
            DROP TABLE "electricity_meter"
        `);
        await queryRunner.query(`
            DROP TABLE "electricity_meter_provider"
        `);
        await queryRunner.query(`
            DROP TABLE "wallet_transaction"
        `);
        await queryRunner.query(`
            DROP TABLE "wallet"
        `);
        await queryRunner.query(`
            DROP TABLE "app_session"
        `);
        await queryRunner.query(`
            DROP TABLE "address"
        `);
        await queryRunner.query(`
            DROP TABLE "lga"
        `);
        await queryRunner.query(`
            DROP TABLE "state"
        `);
        await queryRunner.query(`
            DROP TABLE "country"
        `);
    }
}
