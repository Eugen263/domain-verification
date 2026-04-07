import { jest, describe, it, expect, beforeEach } from "@jest/globals"

;(jest as any).unstable_mockModule("@app/env", () => ({
    env: { DOMAIN_VERIFICATION_TTL: 3600 },
}))

const { GetDomainByIdHandler } = await import("../get_by_id.handler")
const { Domain } = await import("@app/domain/entity/domain")
const { DomainName } = await import("@app/domain/value_object/domain_name")
const { DomainStatus } = await import("@app/domain/value_object/domain_status")
const { VerificationChallenge } = await import("@app/domain/entity/verification_challenge")
const { VerificationChallengeStatus } = await import("@app/domain/value_object/verification_challenge_status")
const { ApiError, ErrorCode } = await import("@app/error")

const makeDomain = () =>
    new Domain(1, new DomainName("example.com"), 42, DomainStatus.PENDING, new Date(), new Date())

const makeChallenge = () =>
    new VerificationChallenge(
        10, 1, "challenge-token",
        VerificationChallengeStatus.PENDING,
        new Date(Date.now() + 3600_000),
        new Date(), new Date()
    )

const makeMocks = () => ({
    domainRepo: {
        findById: jest.fn<(id: number) => Promise<InstanceType<typeof Domain> | null>>(),
    },
    challengeRepo: {
        findChallengeByDomainId: jest.fn<(id: number) => Promise<InstanceType<typeof VerificationChallenge> | null>>(),
    },
    attemptsRepo: {
        getVerificationHistoryByChallengeId: jest.fn<(id: number) => Promise<[]>>(),
    },
})

describe("GetDomainByIdHandler.execute", () => {
    let mocks: ReturnType<typeof makeMocks>
    let handler: InstanceType<typeof GetDomainByIdHandler>

    beforeEach(() => {
        mocks = makeMocks()
        handler = new GetDomainByIdHandler(
            mocks.domainRepo as any,
            mocks.challengeRepo as any,
            mocks.attemptsRepo as any
        )
    })

    // ── not found ─────────────────────────────────────────────────────────────

    it("throws ApiError(404) when the domain does not exist", async () => {
        mocks.domainRepo.findById.mockResolvedValue(null)

        await expect(handler.execute(1)).rejects.toThrow(ApiError)
    })

    it("throws with NotFound code when the domain does not exist", async () => {
        mocks.domainRepo.findById.mockResolvedValue(null)

        await expect(handler.execute(1)).rejects.toMatchObject({ errorCode: ErrorCode.NotFound })
    })

    it("throws ApiError(404) when the challenge does not exist", async () => {
        mocks.domainRepo.findById.mockResolvedValue(makeDomain())
        mocks.challengeRepo.findChallengeByDomainId.mockResolvedValue(null)

        await expect(handler.execute(1)).rejects.toThrow(ApiError)
    })

    it("throws with NotFound code when the challenge does not exist", async () => {
        mocks.domainRepo.findById.mockResolvedValue(makeDomain())
        mocks.challengeRepo.findChallengeByDomainId.mockResolvedValue(null)

        await expect(handler.execute(1)).rejects.toMatchObject({ errorCode: ErrorCode.NotFound })
    })

    // ── happy path ────────────────────────────────────────────────────────────

    it("returns data containing the domain, challenge, and empty history", async () => {
        mocks.domainRepo.findById.mockResolvedValue(makeDomain())
        mocks.challengeRepo.findChallengeByDomainId.mockResolvedValue(makeChallenge())
        mocks.attemptsRepo.getVerificationHistoryByChallengeId.mockResolvedValue([])

        const result = await handler.execute(1)

        expect(result.id).toBe(1)
        expect(result.domain.toString()).toBe("example.com")
        expect(result.challenge.id).toBe(10)
        expect(result.verification_history).toEqual([])
    })

    it("looks up the challenge by the domain id passed to execute", async () => {
        mocks.domainRepo.findById.mockResolvedValue(makeDomain())
        mocks.challengeRepo.findChallengeByDomainId.mockResolvedValue(makeChallenge())
        mocks.attemptsRepo.getVerificationHistoryByChallengeId.mockResolvedValue([])

        await handler.execute(1)

        expect(mocks.challengeRepo.findChallengeByDomainId).toHaveBeenCalledWith(1)
    })

    it("fetches history by the challenge's id", async () => {
        mocks.domainRepo.findById.mockResolvedValue(makeDomain())
        mocks.challengeRepo.findChallengeByDomainId.mockResolvedValue(makeChallenge())
        mocks.attemptsRepo.getVerificationHistoryByChallengeId.mockResolvedValue([])

        await handler.execute(1)

        expect(mocks.attemptsRepo.getVerificationHistoryByChallengeId).toHaveBeenCalledWith(10)
    })
})
