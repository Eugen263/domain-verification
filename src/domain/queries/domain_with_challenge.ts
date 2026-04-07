import { Domain, VerificationChallenge } from "../entity";
import { DomainName, DomainStatus } from "../value_object";

export class DomainWithChallenge extends Domain {
    challenge: VerificationChallenge

    constructor(
        id: number,
        domain: DomainName,
        owner_id: number,
        status: DomainStatus,
        createdAt: Date,
        updatedAt: Date,
        challenge: VerificationChallenge
    ) {
        super(id, domain, owner_id, status, createdAt, updatedAt)
        this.challenge = challenge
    }

    /**
     * Create a DomainWithChallenge from a Domain and its associated VerificationChallenge.
     * 
     * @param domain The domain entity
     * @param challenge The verification challenge entity
     * @returns A new instance of DomainWithChallenge
     */
    static fromDomainAndChallenge(domain: Domain, challenge: VerificationChallenge): DomainWithChallenge {
        return new DomainWithChallenge(
            domain.id,
            domain.domain,
            domain.owner_id,
            domain.status,
            domain.createdAt,
            domain.updatedAt,
            challenge
        )
    }
}