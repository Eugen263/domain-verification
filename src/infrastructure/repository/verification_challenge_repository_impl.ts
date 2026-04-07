import { injectable } from "inversify";

import { AppDataSource } from "@app/config/database";

import { VerificationChallenge } from "@app/domain/entity";
import { VerificationChallengeRepository } from "@app/domain/repository";
import { VerificationChallengeRow } from "../db";

@injectable()
export class VerificationChallengeRepositoryImpl implements VerificationChallengeRepository {
    private readonly repo = AppDataSource.getRepository(VerificationChallengeRow)

    async findChallengeByDomainId(domain_id: number): Promise<VerificationChallenge | null> {
        // We want the most recent challenge for the domain, so we order by created_at DESC and take the first one
        const entity = await this.repo.findOne({ where: { domain_id }, order: { created_at: "DESC" } })
        return entity ? entity.toDomain() : null
    }

    async getPendingChallengesCount(): Promise<number> {
        return await this.repo.count({ where: { status: "pending" } })
    }

    async findPendingChallenges({ limit, offset }: { limit: number; offset: number }): Promise<VerificationChallenge[]> {
        const entities = await this.repo.find({
            where: { status: "pending" },
            order: { created_at: "ASC" },
            skip: offset,
            take: limit,
        })
        return entities.map(e => e.toDomain())
    }
    
    async insert(challenge: VerificationChallenge): Promise<VerificationChallenge> {
        const entity = VerificationChallengeRow.fromDomain(challenge)
        const saved = await this.repo.insert(entity)
        entity.id = saved.identifiers[0].id
        return entity.toDomain()
    }

    async save(challenge: VerificationChallenge): Promise<VerificationChallenge> {
        const entity = VerificationChallengeRow.fromDomain(challenge)
        await this.repo.save(entity)
        return entity.toDomain()
    }
}