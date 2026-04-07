import { Domain, VerificationAttempt, VerificationChallenge } from "../entity";
import { DomainName, DomainStatus } from "../value_object";

export class DomainWithChallengeAndHistory extends Domain {
    challenge: VerificationChallenge
    verification_history: VerificationAttempt[]

    constructor(
        id: number,
        domain: DomainName,
        owner_id: number,
        status: DomainStatus,
        createdAt: Date,
        updatedAt: Date,
        challenge: VerificationChallenge,
        verification_history: VerificationAttempt[]
    ) {
        super(id, domain, owner_id, status, createdAt, updatedAt)
        this.challenge = challenge
        this.verification_history = verification_history
    }

    /**
     * Create a DomainWithChallengeAndHistory from a Domain, its associated VerificationChallenge, and verification history.
     * 
     * @param domain The domain entity
     * @param challenge The verification challenge entity
     * @param verification_history The verification history array
     * @returns A new instance of DomainWithChallengeAndHistory
     */
    static fromDomainAndChallengeAndHistory(
        domain: Domain,
        challenge: VerificationChallenge,
        verification_history: VerificationAttempt[]
    ): DomainWithChallengeAndHistory {
        return new DomainWithChallengeAndHistory(
            domain.id,
            domain.domain,
            domain.owner_id,
            domain.status,
            domain.createdAt,
            domain.updatedAt,
            challenge,
            verification_history
        )
    }
}