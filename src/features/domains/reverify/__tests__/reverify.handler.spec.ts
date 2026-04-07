import { jest, describe, it, expect, beforeEach } from "@jest/globals"

;(jest as any).unstable_mockModule("@app/env", () => ({
    env: { DOMAIN_VERIFICATION_TTL: 3600 },
}))

const { ReverifyDomainHandler } = await import("../reverify.handler")
const { Domain } = await import("@app/domain/entity/domain")
const { DomainName } = await import("@app/domain/value_object/domain_name")
const { DomainStatus } = await import("@app/domain/value_object/domain_status")
const { VerificationChallenge } = await import("@app/domain/entity/verification_challenge")
const { VerificationChallengeStatus } = await import("@app/domain/value_object/verification_challenge_status")

type DomainInstance = InstanceType<typeof Domain>
type ChallengeInstance = InstanceType<typeof VerificationChallenge>

const makeDomain = () =>
    new Domain(7, new DomainName("example.com"), 42, DomainStatus.PENDING, new Date(), new Date())

const makeChallenge = (domainId: number) =>
    new VerificationChallenge(
        20, domainId, "new-challenge-token",
        VerificationChallengeStatus.PENDING,
        new Date(Date.now() + 3600_000),
        new Date(), new Date()
    )

describe("ReverifyDomainHandler.execute", () => {
    let domainRepo: { findById: jest.Mock<(id: number) => Promise<DomainInstance | null>> }
    let challengeRepo: { insert: jest.Mock<(challenge: ChallengeInstance) => Promise<ChallengeInstance>> }
    let handler: InstanceType<typeof ReverifyDomainHandler>

    beforeEach(() => {
        domainRepo = { findById: jest.fn<(id: number) => Promise<DomainInstance | null>>() }
        challengeRepo = { insert: jest.fn<(challenge: ChallengeInstance) => Promise<ChallengeInstance>>() }
        handler = new ReverifyDomainHandler(domainRepo as any, challengeRepo as any)
    })

    // ── not found ─────────────────────────────────────────────────────────────

    it("throws when the domain does not exist", async () => {
        domainRepo.findById.mockResolvedValue(null)

        await expect(handler.execute(7)).rejects.toThrow("Domain with id 7 not found")
    })

    it("does not call challengeRepo.insert when the domain does not exist", async () => {
        domainRepo.findById.mockResolvedValue(null)

        await handler.execute(7).catch(() => {})

        expect(challengeRepo.insert).not.toHaveBeenCalled()
    })

    // ── happy path ────────────────────────────────────────────────────────────

    it("inserts a new verification challenge for the domain", async () => {
        const domain = makeDomain()
        domainRepo.findById.mockResolvedValue(domain)
        challengeRepo.insert.mockResolvedValue(makeChallenge(domain.id))

        await handler.execute(7)

        expect(challengeRepo.insert).toHaveBeenCalledTimes(1)
    })

    it("creates the challenge for the found domain's id", async () => {
        const domain = makeDomain() // id=7
        domainRepo.findById.mockResolvedValue(domain)
        challengeRepo.insert.mockResolvedValue(makeChallenge(domain.id))

        await handler.execute(7)

        const insertedChallenge: ChallengeInstance = challengeRepo.insert.mock.calls[0][0]
        expect(insertedChallenge.domain_id).toBe(7)
    })

    it("returns a DomainWithChallenge containing the domain and new challenge", async () => {
        const domain = makeDomain()
        const challenge = makeChallenge(domain.id)
        domainRepo.findById.mockResolvedValue(domain)
        challengeRepo.insert.mockResolvedValue(challenge)

        const result = await handler.execute(7)

        expect(result.id).toBe(7)
        expect(result.domain.toString()).toBe("example.com")
        expect(result.challenge.id).toBe(20)
    })
})
