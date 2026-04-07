import { jest, describe, it, expect, beforeEach } from "@jest/globals"

;(jest as any).unstable_mockModule("@app/env", () => ({
    env: { DOMAIN_VERIFICATION_TTL: 3600 },
}))

const { GetDomainByIdController } = await import("../get_by_id.controller")
const { Domain } = await import("@app/domain/entity/domain")
const { DomainName } = await import("@app/domain/value_object/domain_name")
const { DomainStatus } = await import("@app/domain/value_object/domain_status")
const { VerificationChallenge } = await import("@app/domain/entity/verification_challenge")
const { VerificationChallengeStatus } = await import("@app/domain/value_object/verification_challenge_status")
const { DomainWithChallengeAndHistory } = await import("@app/domain/queries/domain_with_challenge_history")
const { VerificationAttempt } = await import("@app/domain/entity/verification_attempt")
const { VerificationAttemptStatus } = await import("@app/domain/value_object/verification_attempt_status")
const { ApiError, ErrorCode } = await import("@app/error")

type DomainWithHistoryInstance = InstanceType<typeof DomainWithChallengeAndHistory>

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

describe("GetDomainByIdController.get_by_id", () => {
    let handler: { execute: jest.Mock<(id: number) => Promise<DomainWithHistoryInstance>> }
    let controller: InstanceType<typeof GetDomainByIdController>

    beforeEach(() => {
        handler = { execute: jest.fn<(id: number) => Promise<DomainWithHistoryInstance>>() }
        controller = new GetDomainByIdController(handler as any)
    })

    // ── path parameter forwarding ─────────────────────────────────────────────

    it("calls the handler with the given id", async () => {
        handler.execute.mockResolvedValue(makeDomainWithHistory())

        await controller.get_by_id(5)

        expect(handler.execute).toHaveBeenCalledWith(5)
    })

    // ── response mapping ──────────────────────────────────────────────────────

    it("returns id, domain, challenge id, and empty history from the mapped response", async () => {
        handler.execute.mockResolvedValue(makeDomainWithHistory())

        const result = await controller.get_by_id(5)

        expect(result.id).toBe(5)
        expect(result.domain).toBe("example.com")
        expect(result.challenge.id).toBe(10)
        expect(result.verification_history).toEqual([])
    })

    it("maps verification history entries to DTOs", async () => {
        const attempt = new VerificationAttempt(
            3, 10, VerificationAttemptStatus.SUCCESS, new Date("2024-01-01")
        )
        handler.execute.mockResolvedValue(makeDomainWithHistory([attempt]))

        const result = await controller.get_by_id(5)

        expect(result.verification_history).toHaveLength(1)
        expect(result.verification_history[0].id).toBe(3)
        expect(result.verification_history[0].result).toBe(VerificationAttemptStatus.SUCCESS)
    })

    // ── error propagation ─────────────────────────────────────────────────────

    it("propagates ApiError thrown by the handler", async () => {
        handler.execute.mockRejectedValue(new ApiError(ErrorCode.NotFound, "Domain not found"))

        await expect(controller.get_by_id(99)).rejects.toMatchObject({ errorCode: ErrorCode.NotFound })
    })
})
