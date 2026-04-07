import { jest, describe, it, expect, beforeEach } from "@jest/globals"

;(jest as any).unstable_mockModule("@app/env", () => ({
    env: { DOMAIN_VERIFICATION_TTL: 3600 },
}))

const { RegisterDomainHandler } = await import("../register.handler")
const { Domain } = await import("@app/domain/entity/domain")
const { DomainName } = await import("@app/domain/value_object/domain_name")
const { DomainStatus } = await import("@app/domain/value_object/domain_status")
const { VerificationChallenge } = await import("@app/domain/entity/verification_challenge")
const { VerificationChallengeStatus } = await import("@app/domain/value_object/verification_challenge_status")

type DomainInstance = InstanceType<typeof Domain>
type ChallengeInstance = InstanceType<typeof VerificationChallenge>

const makeInsertedDomain = () =>
    new Domain(99, new DomainName("example.com"), 42, DomainStatus.PENDING, new Date(), new Date())

const makeInsertedChallenge = (domainId: number) =>
    new VerificationChallenge(
        55, domainId, "challenge-token",
        VerificationChallengeStatus.PENDING,
        new Date(Date.now() + 3600_000),
        new Date(), new Date()
    )

describe("RegisterDomainHandler.execute", () => {
    let domainRepo: { insert: jest.Mock<(domain: DomainInstance) => Promise<DomainInstance>> }
    let challengeRepo: { insert: jest.Mock<(challenge: ChallengeInstance) => Promise<ChallengeInstance>> }
    let handler: InstanceType<typeof RegisterDomainHandler>

    beforeEach(() => {
        domainRepo = { insert: jest.fn<(domain: DomainInstance) => Promise<DomainInstance>>() }
        challengeRepo = { insert: jest.fn<(challenge: ChallengeInstance) => Promise<ChallengeInstance>>() }
        handler = new RegisterDomainHandler(domainRepo as any, challengeRepo as any)
    })

    // ── invalid input ─────────────────────────────────────────────────────────

    it("throws when the domain name is invalid", async () => {
        await expect(handler.execute("not-a-domain", 1)).rejects.toThrow()
    })

    it("does not call domainRepo.insert when the domain name is invalid", async () => {
        await handler.execute("not-a-domain", 1).catch(() => {})

        expect(domainRepo.insert).not.toHaveBeenCalled()
    })

    // ── happy path ────────────────────────────────────────────────────────────

    it("inserts the domain into the repository", async () => {
        const inserted = makeInsertedDomain()
        domainRepo.insert.mockResolvedValue(inserted)
        challengeRepo.insert.mockResolvedValue(makeInsertedChallenge(inserted.id))

        await handler.execute("example.com", 42)

        expect(domainRepo.insert).toHaveBeenCalledTimes(1)
    })

    it("inserts a verification challenge for the new domain", async () => {
        const inserted = makeInsertedDomain()
        domainRepo.insert.mockResolvedValue(inserted)
        challengeRepo.insert.mockResolvedValue(makeInsertedChallenge(inserted.id))

        await handler.execute("example.com", 42)

        expect(challengeRepo.insert).toHaveBeenCalledTimes(1)
    })

    it("creates the challenge for the repo-assigned domain id, not the pre-insert id", async () => {
        const inserted = makeInsertedDomain() // id=99
        domainRepo.insert.mockResolvedValue(inserted)
        challengeRepo.insert.mockResolvedValue(makeInsertedChallenge(inserted.id))

        await handler.execute("example.com", 42)

        const insertedChallenge: ChallengeInstance = challengeRepo.insert.mock.calls[0][0]
        expect(insertedChallenge.domain_id).toBe(99)
    })

    it("returns a DomainWithChallenge containing the inserted domain and challenge", async () => {
        const inserted = makeInsertedDomain()
        const challenge = makeInsertedChallenge(inserted.id)
        domainRepo.insert.mockResolvedValue(inserted)
        challengeRepo.insert.mockResolvedValue(challenge)

        const result = await handler.execute("example.com", 42)

        expect(result.id).toBe(99)
        expect(result.domain.toString()).toBe("example.com")
        expect(result.challenge.id).toBe(55)
    })
})
