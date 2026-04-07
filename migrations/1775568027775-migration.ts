import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1775568027775 implements MigrationInterface {
    name = 'Migration1775568027775'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "domains" ADD CONSTRAINT "UQ_5346af016e911f3008ce7aa9a22" UNIQUE ("domain")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "domains" DROP CONSTRAINT "UQ_5346af016e911f3008ce7aa9a22"`);
    }

}
