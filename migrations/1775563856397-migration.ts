import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1775563856397 implements MigrationInterface {
    name = 'Migration1775563856397'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "domains" ("id" SERIAL NOT NULL, "domain" text NOT NULL, "owner_id" integer NOT NULL, "status" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_05a6b087662191c2ea7f7ddfc4d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_domains_domain" ON "domains" ("domain") `);
        await queryRunner.query(`CREATE INDEX "idx_domains_owner" ON "domains" ("owner_id") `);
        await queryRunner.query(`CREATE INDEX "idx_domains_status" ON "domains" ("status") `);
        await queryRunner.query(`CREATE TABLE "verification_challenges" ("id" SERIAL NOT NULL, "domain_id" integer NOT NULL, "challenge" text NOT NULL, "status" text NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "domainIdId" integer, CONSTRAINT "PK_a32154d92462ede7fa3879002b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_challenges_domain_id" ON "verification_challenges" ("domain_id") `);
        await queryRunner.query(`CREATE INDEX "idx_challenges_status" ON "verification_challenges" ("status") `);
        await queryRunner.query(`CREATE TABLE "verification_attempts" ("id" SERIAL NOT NULL, "challenge_id" integer NOT NULL, "result" text NOT NULL, "checked_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "dns_response" text NOT NULL, CONSTRAINT "PK_2cc0cabfe71231719a23cfcdaf8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "verification_challenges" ADD CONSTRAINT "FK_08921aba680908e9ae646927d50" FOREIGN KEY ("domainIdId") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "verification_challenges" DROP CONSTRAINT "FK_08921aba680908e9ae646927d50"`);
        await queryRunner.query(`DROP TABLE "verification_attempts"`);
        await queryRunner.query(`DROP INDEX "public"."idx_challenges_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_challenges_domain_id"`);
        await queryRunner.query(`DROP TABLE "verification_challenges"`);
        await queryRunner.query(`DROP INDEX "public"."idx_domains_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_domains_owner"`);
        await queryRunner.query(`DROP INDEX "public"."idx_domains_domain"`);
        await queryRunner.query(`DROP TABLE "domains"`);
    }

}
