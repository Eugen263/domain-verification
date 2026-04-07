import { jest, describe, it, expect, beforeEach } from "@jest/globals"

;(jest as any).unstable_mockModule("@app/env", () => ({
    env: { DOMAIN_VERIFICATION_TTL: 3600 },
}))

const { ReverifyDomainController } = await import("../reverivy.controller")
const { Domain } = await import("@app/domain/entity/domain")
const { DomainName } = await import("@app/domain/value_object/domain_name")
const { DomainStatus } = await import("@app/domain/value_object/domain_status")
const { VerificationChallenge } = await import("@app/domain/entity/verification_challenge")
const { VerificationChallengeStatus } = await import("@app/domain/value_object/verification_challenge_status")
const { DomainWithChallenge } = await import("@app/domain/queries/domain_with_challenge")

type DomainWithChallengeInstance = InstanceType<typeof DomainWithChallenge>

const makeDomainWithChallenge = () => {
    const now = new Date()
    const domain = new Domain(7, new DomainName("example.com"), 42, DomainStatus.PENDING, now, now)
    const challenge = new VerificationChallenge(
        20, 7, "new-challenge-token",
        VerificationChallengeStatus.PENDING,
        new Date(Date.now() + 3600_000), now, now
    )
    return DomainWithChallenge.fromDomainAndChallenge(domain, challenge)
}

describe("ReverifyDomainController.reverifyDomain", () => {
    let handler: { execute: jest.Mock<(id: number) => Promise<DomainWithChallengeInstance>> }
    let controller: InstanceType<typeof ReverifyDomainController>

    beforeEach(() => {
        handler = { execute: jest.fn<(id: number) => Promise<DomainWithChallengeInstance>>() }
        controller = new ReverifyDomainController(handler as any)
    })

    // ── path parameter forwarding ─────────────────────────────────────────────

    it("calls the handler with the given id", async () => {
        handler.execute.mockResolvedValue(makeDomainWithChallenge())

        await controller.reverifyDomain(7)

        expect(handler.execute).toHaveBeenCalledWith(7)
    })

    // ── response mapping ──────────────────────────────────────────────────────

    it("returns id, domain, and new challenge id from the mapped response", async () => {
        handler.execute.mockResolvedValue(makeDomainWithChallenge())

        const result = await controller.reverifyDomain(7)

        expect(result.id).toBe(7)
        expect(result.domain).toBe("example.com")
        expect(result.challenge.id).toBe(20)
    })

    // ── error propagation ─────────────────────────────────────────────────────

    it("propagates errors thrown by the handler", async () => {
        handler.execute.mockRejectedValue(new Error("Domain with id 99 not found"))

        await expect(controller.reverifyDomain(99)).rejects.toThrow("Domain with id 99 not found")
    })
})
