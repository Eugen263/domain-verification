import { inject, injectable } from "inversify";

import { TYPES } from "@app/di/symbols";
import { DomainWithChallengeAndHistory } from "@app/domain/queries";
import { DomainRepository, VerificationAttemptsRepository, VerificationChallengeRepository } from "@app/domain/repository";
import { ApiError, ErrorCode } from "@app/error";

@injectable()
export class GetDomainByIdHandler {
    constructor(
        @inject(TYPES.DomainRepository) private domainRepository: DomainRepository,
        @inject(TYPES.VerificationChallengeRepository) private challengeRepository: VerificationChallengeRepository,
        @inject(TYPES.VerificationAttemptsRepository) private attemptsRepository: VerificationAttemptsRepository
    ) {}

    async execute(id: number): Promise<DomainWithChallengeAndHistory> {
        const domain = await this.domainRepository.findById(id)
        if (!domain) {
            throw new ApiError(ErrorCode.NotFound, `Domain with id ${id} not found`)
        }

        const challenge = await this.challengeRepository.findChallengeByDomainId(id)
        if (!challenge) {
            throw new ApiError(ErrorCode.NotFound, `Verification challenge for domain with id ${id} not found`)
        }

        const verification_history = await this.attemptsRepository.getVerificationHistoryByChallengeId(challenge.id)

        let allData = DomainWithChallengeAndHistory.fromDomainAndChallengeAndHistory(
            domain,
            challenge,
            verification_history
        )

        return allData
    }
}