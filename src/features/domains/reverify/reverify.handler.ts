import { TYPES } from "@app/di/symbols";
import { VerificationChallenge } from "@app/domain/entity";
import { DomainWithChallenge } from "@app/domain/queries";
import { DomainRepository, VerificationChallengeRepository } from "@app/domain/repository";
import { inject, injectable } from "inversify";

@injectable()
export class ReverifyDomainHandler {
    constructor(
        @inject(TYPES.DomainRepository) private domainRepository: DomainRepository,
        @inject(TYPES.VerificationChallengeRepository) private challengeRepository: VerificationChallengeRepository
    ) {}

    async execute(id: number): Promise<DomainWithChallenge> {
        const domain = await this.domainRepository.findById(id)
        if (!domain) {
            throw new Error(`Domain with id ${id} not found`)
        }

        const challenge = VerificationChallenge.create(domain.id)

        const newChallenge = await this.challengeRepository.insert(challenge)

        return DomainWithChallenge.fromDomainAndChallenge(domain, newChallenge)
    }
}