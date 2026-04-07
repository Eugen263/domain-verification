import { injectable } from "inversify";

import { AppDataSource } from "@app/config/database";

import { VerificationAttempt } from "@app/domain/entity";
import { VerificationAttemptsRepository } from "@app/domain/repository";
import { VerificationAttemptsRow } from "../db";

@injectable()
export class VerificationAttemptsRepositoryImpl extends VerificationAttemptsRepository {
    private readonly repo = AppDataSource.getRepository(VerificationAttemptsRow)

    async insert(attempt: VerificationAttempt): Promise<void> {
        const entity = VerificationAttemptsRow.fromDomain(attempt)
        await this.repo.insert(entity)
    }

    async save(attempt: VerificationAttempt): Promise<void> {
        const entity = VerificationAttemptsRow.fromDomain(attempt)
        await this.repo.save(entity)
    }

    async getVerificationHistoryByChallengeId(challengeId: number): Promise<VerificationAttempt[]> {
        const rows = await this.repo.find({
            where: { challenge_id: challengeId },
            order: { checked_at: "DESC" }
        })
        return rows.map(VerificationAttemptsRow.toDomain)
    }
}