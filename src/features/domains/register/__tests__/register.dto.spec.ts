import { jest, describe, it, expect } from "@jest/globals"

;(jest as any).unstable_mockModule("@app/env", () => ({
    env: { DOMAIN_VERIFICATION_TTL: 3600 },
}))

const { RegisterDomainResponse } = await import("../register.dto")
const { DomainStatus } = await import("@app/domain/value_object/domain_status")
const { Domain } = await import("@app/domain/entity/domain")
const { DomainName } = await import("@app/domain/value_object/domain_name")
const { VerificationChallenge } = await import("@app/domain/entity/verification_challenge")
const { VerificationChallengeStatus } = await import("@app/domain/value_object/verification_challenge_status")
const { DomainWithChallenge } = await import("@app/domain/queries/domain_with_challenge")

const makeDomainWithChallenge = () => {
    const now = new Date()
    const domain = new Domain(1, new DomainName("example.com"), 42, DomainStatus.PENDING, now, now)
    const challenge = new VerificationChallenge(
        5, 1, "challenge-token",
        VerificationChallengeStatus.PENDING,
        new Date(Date.now() + 3600_000), now, now
    )
    return DomainWithChallenge.fromDomainAndChallenge(domain, challenge)
}

describe("RegisterDomainResponse.fromDomainWithChallenge", () => {
    it("maps all domain fields correctly", () => {
        const result = RegisterDomainResponse.fromDomainWithChallenge(makeDomainWithChallenge())

        expect(result.id).toBe(1)
        expect(result.domain).toBe("example.com")
        expect(result.owner_id).toBe(42)
        expect(result.status).toBe(DomainStatus.PENDING)
    })

    it("maps all challenge fields correctly", () => {
        const result = RegisterDomainResponse.fromDomainWithChallenge(makeDomainWithChallenge())

        expect(result.challenge.id).toBe(5)
        expect(result.challenge.challenge).toBe("challenge-token")
        expect(result.challenge.status).toBe(VerificationChallengeStatus.PENDING)
        expect(result.challenge.expiresAt).toBeInstanceOf(Date)
    })
})
