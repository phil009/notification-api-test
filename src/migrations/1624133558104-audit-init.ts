import { MigrationInterface, QueryRunner } from 'typeorm';

export class auditInit1624133558104 implements MigrationInterface {
    name = 'auditInit1624133558104';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "_code_context" (
                "id" BIGSERIAL NOT NULL,
                "file_name" text NOT NULL,
                "method_name" text NOT NULL,
                "method_signature" text NOT NULL,
                "line_number" integer NOT NULL,
                CONSTRAINT "PK_0572af1a884cf17f41b9f4a9ef6" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "_transaction_log" (
                "id" BIGSERIAL NOT NULL,
                "activity_id" bigint NOT NULL,
                "started_at" TIMESTAMP NOT NULL,
                "nano_seconds_taken" bigint,
                CONSTRAINT "PK_aeb930af5be6a7c1589e5565011" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "_activity_log" (
                "id" BIGSERIAL NOT NULL,
                "started_by" character varying,
                "name" character varying NOT NULL,
                "description" text,
                "depth" integer NOT NULL,
                "status" character varying NOT NULL,
                "parent_id" bigint,
                "transaction_id" bigint,
                "entry_point_id" bigint,
                "started_at" TIMESTAMP NOT NULL,
                "nano_seconds_taken" bigint,
                CONSTRAINT "PK_54e6001116797892a4459e37e7d" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "_entity_state" (
                "id" BIGSERIAL NOT NULL,
                "entity_name" text NOT NULL,
                "entity_id" character varying NOT NULL,
                "operation_type" character varying NOT NULL,
                "transaction_id" bigint NOT NULL,
                CONSTRAINT "PK_5ea2d8edf2af8ee9503cd78a7ce" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "_entity_state_attribute" (
                "id" BIGSERIAL NOT NULL,
                "name" character varying NOT NULL,
                "modified" boolean NOT NULL,
                "has_previous_value" boolean NOT NULL,
                "has_new_value" boolean NOT NULL,
                "new_value" text,
                "previous_value" text,
                "entity_state_id" bigint NOT NULL,
                CONSTRAINT "PK_93681c49ac72a53fb935093343b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "_web_request" (
                "id" BIGSERIAL NOT NULL,
                "user_id" character varying,
                "session_id" character varying,
                "request_id" character varying,
                "ip_address" character varying NOT NULL,
                "user_agent" character varying,
                "scheme" character varying NOT NULL,
                "host" character varying NOT NULL,
                "path" character varying NOT NULL,
                "method" character varying NOT NULL,
                "status_code" integer,
                "route_matching_load_in_ns" bigint,
                "token_verification_load_in_ns" bigint,
                "handler_activity_id" bigint,
                "started_at" TIMESTAMP NOT NULL,
                "nano_seconds_taken" bigint,
                CONSTRAINT "PK_e4196fe60e801e4f0a509a4603a" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "_transaction_log"
            ADD CONSTRAINT "FK_af7ff0d5f9ea0980e67f0e2d6d6" FOREIGN KEY ("activity_id") REFERENCES "_activity_log"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "_activity_log"
            ADD CONSTRAINT "FK_db3cdae8851809f14d3f14f6b06" FOREIGN KEY ("parent_id") REFERENCES "_activity_log"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "_activity_log"
            ADD CONSTRAINT "FK_7c0a53285f6be2ffa0fe1480487" FOREIGN KEY ("transaction_id") REFERENCES "_transaction_log"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "_activity_log"
            ADD CONSTRAINT "FK_c7f33014af1e64b0b92d36b3352" FOREIGN KEY ("entry_point_id") REFERENCES "_code_context"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "_entity_state"
            ADD CONSTRAINT "FK_3015009ec20a88211eaf1f1be17" FOREIGN KEY ("transaction_id") REFERENCES "_transaction_log"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "_entity_state_attribute"
            ADD CONSTRAINT "FK_eda868a72e1ed5dfd118b63a019" FOREIGN KEY ("entity_state_id") REFERENCES "_entity_state"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "_web_request"
            ADD CONSTRAINT "FK_00e5cf19f88e037958df50eec07" FOREIGN KEY ("handler_activity_id") REFERENCES "_activity_log"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "_web_request" DROP CONSTRAINT "FK_00e5cf19f88e037958df50eec07"
        `);
        await queryRunner.query(`
            ALTER TABLE "_entity_state_attribute" DROP CONSTRAINT "FK_eda868a72e1ed5dfd118b63a019"
        `);
        await queryRunner.query(`
            ALTER TABLE "_entity_state" DROP CONSTRAINT "FK_3015009ec20a88211eaf1f1be17"
        `);
        await queryRunner.query(`
            ALTER TABLE "_activity_log" DROP CONSTRAINT "FK_c7f33014af1e64b0b92d36b3352"
        `);
        await queryRunner.query(`
            ALTER TABLE "_activity_log" DROP CONSTRAINT "FK_7c0a53285f6be2ffa0fe1480487"
        `);
        await queryRunner.query(`
            ALTER TABLE "_activity_log" DROP CONSTRAINT "FK_db3cdae8851809f14d3f14f6b06"
        `);
        await queryRunner.query(`
            ALTER TABLE "_transaction_log" DROP CONSTRAINT "FK_af7ff0d5f9ea0980e67f0e2d6d6"
        `);
        await queryRunner.query(`
            DROP TABLE "_web_request"
        `);
        await queryRunner.query(`
            DROP TABLE "_entity_state_attribute"
        `);
        await queryRunner.query(`
            DROP TABLE "_entity_state"
        `);
        await queryRunner.query(`
            DROP TABLE "_activity_log"
        `);
        await queryRunner.query(`
            DROP TABLE "_transaction_log"
        `);
        await queryRunner.query(`
            DROP TABLE "_code_context"
        `);
    }
}
