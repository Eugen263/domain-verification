import { inject, injectable } from "inversify"

import { Domain } from "@app/domain/entity/domain"
import { DomainName } from "@app/domain/value_object/domain_name"
import { DomainRepository } from "@app/domain/repository/domain_repository"

import { TYPES } from "@app/di/symbols"
import { VerificationChallenge } from "@app/domain/entity"
import { DomainWithChallenge } from "@app/domain/queries/domain_with_challenge"

@injectable()
export class RegisterDomainHandler {
    constructor(
        @inject(TYPES.DomainRepository) private readonly domainRepository: DomainRepository,
        @inject(TYPES.VerificationChallengeRepository) private readonly challengeRepository: any,
    ) {}

    async execute(domainName: string, owner: number): Promise<DomainWithChallenge> {
        const name = new DomainName(domainName)

        const domain = Domain.create(name, owner)
        const newDomain = await this.domainRepository.insert(domain);

        const verificationChallenge = VerificationChallenge.create(newDomain.id)
        let challenge = await this.challengeRepository.insert(verificationChallenge)

        return DomainWithChallenge.fromDomainAndChallenge(newDomain, challenge)
    }
}
