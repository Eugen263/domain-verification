import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1775572627656 implements MigrationInterface {
    name = 'Migration1775572627656'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "verification_attempts" ALTER COLUMN "dns_response" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "verification_attempts" ALTER COLUMN "dns_response" SET NOT NULL`);
    }

}
