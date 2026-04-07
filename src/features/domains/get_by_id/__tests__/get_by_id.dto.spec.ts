import { jest, describe, it, expect } from "@jest/globals"

;(jest as any).unstable_mockModule("@app/env", () => ({
    env: { DOMAIN_VERIFICATION_TTL: 3600 },
}))

const { GetDomainByIdResponse } = await import("../get_by_id.dto")
const { Domain } = await import("@app/domain/entity/domain")
const { DomainName } = await import("@app/domain/value_object/domain_name")
const { DomainStatus } = await import("@app/domain/value_object/domain_status")
const { VerificationChallenge } = await import("@app/domain/entity/verification_challenge")
const { VerificationChallengeStatus } = await import("@app/domain/value_object/verification_challenge_status")
const { VerificationAttempt } = await import("@app/domain/entity/verification_attempt")
const { VerificationAttemptStatus } = await import("@app/domain/value_object/verification_attempt_status")
const { DomainWithChallengeAndHistory } = await import("@app/domain/queries/domain_with_challenge_history")

const makeDomainWithHistory = (history: InstanceType<typeof VerificationAttempt>[] = []) => {
    const now = new Date()
    const domain = new Domain(5, new DomainName("example.com"), 42, DomainStatus.VERIFIED, now, now)
    const challenge = new VerificationChallenge(
        10, 5, "challenge-token",
        VerificationChallengeStatus.PENDING,
        new Date(Date.now() + 3600_000), now, now
    )
    return DomainWithChallengeAndHistory.fromDomainAndChallengeAndHistory(domain, challenge, history)
}

describe("GetDomainByIdResponse.fromDomainWithChallengeAndHistory", () => {
    it("maps all domain fields correctly", () => {
        const result = GetDomainByIdResponse.fromDomainWithChallengeAndHistory(makeDomainWithHistory())

        expect(result.id).toBe(5)
        expect(result.domain).toBe("example.com")
        expect(result.owner_id).toBe(42)
        expect(result.status).toBe(DomainStatus.VERIFIED)
    })

    it("maps challenge fields correctly", () => {
        const result = GetDomainByIdResponse.fromDomainWithChallengeAndHistory(makeDomainWithHistory())

        expect(result.challenge.id).toBe(10)
        expect(result.challenge.challenge).toBe("challenge-token")
        expect(result.challenge.status).toBe(VerificationChallengeStatus.PENDING)
    })

    it("returns empty verification_history when there are no attempts", () => {
        const result = GetDomainByIdResponse.fromDomainWithChallengeAndHistory(makeDomainWithHistory())

        expect(result.verification_history).toEqual([])
    })

    it("maps verification history attempts to DTOs", () => {
        const attempt = new VerificationAttempt(
            7, 10, VerificationAttemptStatus.SUCCESS, new Date("2024-06-01")
        )
        const result = GetDomainByIdResponse.fromDomainWithChallengeAndHistory(makeDomainWithHistory([attempt]))

        expect(result.verification_history).toHaveLength(1)
        expect(result.verification_history[0].id).toBe(7)
        expect(result.verification_history[0].result).toBe(VerificationAttemptStatus.SUCCESS)
        expect(result.verification_history[0].checkedAt).toEqual(new Date("2024-06-01"))
    })
})
