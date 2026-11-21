import { MigrationInterface, QueryRunner } from 'typeorm';

export class tenurePaymentNotification1785686628063 implements MigrationInterface {
    name = 'tenurePaymentNotification1785686628063';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "tenure_payment"
            ADD "notification_id" uuid
        `);
        await queryRunner.query(`
            ALTER TABLE "tenure_payment"
            ADD CONSTRAINT "UQ_tenure_payment_notification_id" UNIQUE ("notification_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "tenure_payment"
            ADD CONSTRAINT "FK_tenure_payment_notification_id" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "tenure_payment" DROP CONSTRAINT "FK_tenure_payment_notification_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "tenure_payment" DROP CONSTRAINT "UQ_tenure_payment_notification_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "tenure_payment" DROP COLUMN "notification_id"
        `);
    }
}
