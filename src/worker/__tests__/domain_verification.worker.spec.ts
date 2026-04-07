import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals"

const mockResolveTxt = jest.fn<(hostname: string) => Promise<string[][]>>()

;(jest as any).unstable_mockModule("@app/env", () => ({
    env: {
        DOMAIN_VERIFICATION_TTL: 3600,
        DOMAIN_VERIFICATION_WORKER_POOL_SIZE: 2,
    },
}))

;(jest as any).unstable_mockModule("dns/promises", () => ({
    default: {
        resolveTxt: mockResolveTxt,
        setDefaultResultOrder: jest.fn(),
        setServers: jest.fn(),
    },
}))

// All domain entity imports must be dynamic — static imports would execute
// their module code (including env.ts) before the mocks above take effect.
const { DomainVerificationWorker } = await import("../domain_verification.worker")
const { VerificationChallenge } = await import("../../domain/entity/verification_challenge")
const { VerificationChallengeStatus } = await import("../../domain/value_object/verification_challenge_status")
const { VerificationAttemptStatus } = await import("../../domain/value_object/verification_attempt_status")
const { VerificationAttempt } = await import("../../domain/entity/verification_attempt")
const { Domain } = await import("../../domain/entity/domain")
const { DomainName } = await import("../../domain/value_object/domain_name")
const { DomainStatus } = await import("../../domain/value_object/domain_status")
const { logger } = await import("../../utils")

// ─── helpers ─────────────────────────────────────────────────────────────────

const makeChallenge = (overrides: Partial<InstanceType<typeof VerificationChallenge>> = {}) => {
    const now = new Date()
    const future = new Date(now.getTime() + 3600 * 1000)
    return Object.assign(
        new VerificationChallenge(1, 10, "challenge-token", VerificationChallengeStatus.PENDING, future, now, now),
        overrides
    )
}

// Returns a real Domain instance so worker calls to domain.setStatus() work correctly.
const makeDomainMock = (name = "example.com") => {
    const now = new Date()
    return new Domain(1, new DomainName(name), 1, DomainStatus.PENDING, now, now)
}

const makeMocks = () => ({
    webhookHandler: {
        sendVerificationResult: jest.fn<(message: unknown) => Promise<void>>(),
    },
    domainRepo: {
        findById: jest.fn<(id: number) => Promise<ReturnType<typeof makeDomainMock> | null>>(),
        insert: jest.fn(),
        save: jest.fn(),
        markAsVerified: jest.fn<(domainId: number) => Promise<void>>(),
    },
    challengeRepo: {
        getPendingChallengesCount: jest.fn<() => Promise<number>>(),
        findPendingChallenges: jest.fn<(opts: { limit: number; offset: number }) => Promise<InstanceType<typeof VerificationChallenge>[]>>(),
        findChallengeByDomainId: jest.fn(),
        insert: jest.fn(),
        save: jest.fn<(c: InstanceType<typeof VerificationChallenge>) => Promise<InstanceType<typeof VerificationChallenge>>>(),
    },
    attemptsRepo: {
        insert: jest.fn<(attempt: InstanceType<typeof VerificationAttempt>) => Promise<void>>(),
        save: jest.fn(),
    },
})

// ─── tests ───────────────────────────────────────────────────────────────────

describe("DomainVerificationWorker", () => {
    let mocks: ReturnType<typeof makeMocks>
    let worker: InstanceType<typeof DomainVerificationWorker>

    beforeEach(() => {
        mocks = makeMocks()
        worker = new DomainVerificationWorker(
            mocks.webhookHandler as any,
            mocks.domainRepo as any,
            mocks.challengeRepo as any,
            mocks.attemptsRepo as any
        )
        mockResolveTxt.mockReset()
    })

    // ── start / stop ──────────────────────────────────────────────────────────

    describe("start / stop", () => {
        beforeEach(async () => jest.useFakeTimers())
        afterEach(async () => jest.useRealTimers())

        it("sets intervalId after start", () => {
            mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(0)
            worker.start()
            expect((worker as any).intervalId).not.toBeNull()
        })

        it("warns and returns if called when already running", () => {
            mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(0)
            const warn = jest.spyOn(logger, "warn").mockImplementation(() => logger)
            worker.start()
            worker.start()
            expect(warn).toHaveBeenCalled()
            warn.mockRestore()
        })

        it("clears intervalId on stop", () => {
            mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(0)
            worker.start()
            worker.stop()
            expect((worker as any).intervalId).toBeNull()
        })

        it("does nothing when stop is called before start", () => {
            expect(() => worker.stop()).not.toThrow()
            expect((worker as any).intervalId).toBeNull()
        })

        it("skips verifyDomains when isRunning is true at the time the interval fires", () => {
            ;(worker as any).isRunning = true
            const verifySpy = jest.spyOn(worker as any, "verifyDomains")
            worker.start()
            jest.advanceTimersByTime(60_000)
            expect(verifySpy).not.toHaveBeenCalled()
            worker.stop()
        })

        it("calls verifyDomains when interval fires and isRunning is false", async () => {
            mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(0)
            const verifySpy = jest.spyOn(worker as any, "verifyDomains")
            worker.start()
            jest.advanceTimersByTime(60_000)
            expect(verifySpy).toHaveBeenCalledTimes(1)
            worker.stop()
        })
    })

    // ── verifyDomains ─────────────────────────────────────────────────────────

    describe("verifyDomains", () => {
        it("returns early and skips batching when there are no pending challenges", async () => {
            mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(0)

            await (worker as any).verifyDomains()

            expect(mocks.challengeRepo.findPendingChallenges).not.toHaveBeenCalled()
        })

        it("fetches challenges in batches using pool size and total count", async () => {
            mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(3)
            mocks.challengeRepo.findPendingChallenges
                .mockResolvedValueOnce([makeChallenge(), makeChallenge()])
                .mockResolvedValueOnce([makeChallenge()])
            mocks.domainRepo.findById.mockResolvedValue(makeDomainMock())
            mockResolveTxt.mockResolvedValue([])

            await (worker as any).verifyDomains()

            expect(mocks.challengeRepo.findPendingChallenges).toHaveBeenCalledTimes(2)
            expect(mocks.challengeRepo.findPendingChallenges).toHaveBeenNthCalledWith(1, { limit: 2, offset: 0 })
            expect(mocks.challengeRepo.findPendingChallenges).toHaveBeenNthCalledWith(2, { limit: 2, offset: 2 })
        })

        // ── expired challenge ───────────────────────────────────────────────

        describe("when challenge is expired", () => {
            it("marks the challenge as failed", async () => {
                const expired = makeChallenge({ expires_at: new Date("2024-01-01T00:00:00.000Z") })
                mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(1)
                mocks.challengeRepo.findPendingChallenges.mockResolvedValue([expired])
                mocks.domainRepo.findById.mockResolvedValue(makeDomainMock())
                mocks.attemptsRepo.insert.mockResolvedValue(undefined)
                mocks.challengeRepo.save.mockResolvedValue(expired)

                await (worker as any).verifyDomains()

                expect(expired.status).toBe(VerificationChallengeStatus.FAILED)
            })

            it("sets the domain status to EXPIRED", async () => {
                const expired = makeChallenge({ expires_at: new Date("2024-01-01T00:00:00.000Z") })
                const domain = makeDomainMock()
                mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(1)
                mocks.challengeRepo.findPendingChallenges.mockResolvedValue([expired])
                mocks.domainRepo.findById.mockResolvedValue(domain)
                mocks.attemptsRepo.insert.mockResolvedValue(undefined)
                mocks.challengeRepo.save.mockResolvedValue(expired)

                await (worker as any).verifyDomains()

                expect(domain.status).toBe(DomainStatus.EXPIRED)
            })

            it("inserts a failed verification attempt with the correct challenge id", async () => {
                const expired = makeChallenge({ expires_at: new Date("2024-01-01T00:00:00.000Z") })
                mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(1)
                mocks.challengeRepo.findPendingChallenges.mockResolvedValue([expired])
                mocks.domainRepo.findById.mockResolvedValue(makeDomainMock())
                mocks.attemptsRepo.insert.mockResolvedValue(undefined)
                mocks.challengeRepo.save.mockResolvedValue(expired)

                await (worker as any).verifyDomains()

                const insertedAttempt = mocks.attemptsRepo.insert.mock.calls[0]![0]!
                expect(insertedAttempt.result).toBe(VerificationAttemptStatus.FAILED)
                expect(insertedAttempt.challenge_id).toBe(expired.id)
            })

            it("saves the updated challenge status", async () => {
                const expired = makeChallenge({ expires_at: new Date("2024-01-01T00:00:00.000Z") })
                mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(1)
                mocks.challengeRepo.findPendingChallenges.mockResolvedValue([expired])
                mocks.domainRepo.findById.mockResolvedValue(makeDomainMock())
                mocks.attemptsRepo.insert.mockResolvedValue(undefined)
                mocks.challengeRepo.save.mockResolvedValue(expired)

                await (worker as any).verifyDomains()

                expect(mocks.challengeRepo.save).toHaveBeenCalledWith(expired)
            })

            it("does not perform a DNS lookup", async () => {
                const expired = makeChallenge({ expires_at: new Date("2024-01-01T00:00:00.000Z") })
                mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(1)
                mocks.challengeRepo.findPendingChallenges.mockResolvedValue([expired])
                mocks.domainRepo.findById.mockResolvedValue(makeDomainMock())
                mocks.attemptsRepo.insert.mockResolvedValue(undefined)
                mocks.challengeRepo.save.mockResolvedValue(expired)

                await (worker as any).verifyDomains()

                expect(mockResolveTxt).not.toHaveBeenCalled()
            })
        })

        // ── domain not found ────────────────────────────────────────────────

        describe("when domain is not found", () => {
            it("inserts a failed attempt and skips DNS lookup", async () => {
                const challenge = makeChallenge()
                mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(1)
                mocks.challengeRepo.findPendingChallenges.mockResolvedValue([challenge])
                mocks.domainRepo.findById.mockResolvedValue(null)
                mocks.attemptsRepo.insert.mockResolvedValue(undefined)

                await (worker as any).verifyDomains()

                const attempt = mocks.attemptsRepo.insert.mock.calls[0]![0]!
                expect(attempt.result).toBe(VerificationAttemptStatus.FAILED)
                expect(mockResolveTxt).not.toHaveBeenCalled()
            })

            it("does not persist the challenge when domain is not found", async () => {
                const challenge = makeChallenge()
                mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(1)
                mocks.challengeRepo.findPendingChallenges.mockResolvedValue([challenge])
                mocks.domainRepo.findById.mockResolvedValue(null)
                mocks.attemptsRepo.insert.mockResolvedValue(undefined)

                await (worker as any).verifyDomains()

                expect(mocks.challengeRepo.save).not.toHaveBeenCalled()
            })

            it("looks up domain by the challenge's domain_id", async () => {
                const challenge = makeChallenge({ domain_id: 42 })
                mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(1)
                mocks.challengeRepo.findPendingChallenges.mockResolvedValue([challenge])
                mocks.domainRepo.findById.mockResolvedValue(null)
                mocks.attemptsRepo.insert.mockResolvedValue(undefined)

                await (worker as any).verifyDomains()

                expect(mocks.domainRepo.findById).toHaveBeenCalledWith(42)
            })
        })

        // ── DNS resolution ──────────────────────────────────────────────────

        describe("when domain is found", () => {
            it("resolves TXT records for the correct domain name", async () => {
                const challenge = makeChallenge()
                mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(1)
                mocks.challengeRepo.findPendingChallenges.mockResolvedValue([challenge])
                mocks.domainRepo.findById.mockResolvedValue(makeDomainMock("example.com"))
                mocks.challengeRepo.save.mockResolvedValue(challenge)
                mocks.attemptsRepo.insert.mockResolvedValue(undefined)
                mockResolveTxt.mockResolvedValue([["some-txt-record"]])

                await (worker as any).verifyDomains()

                expect(mockResolveTxt).toHaveBeenCalledWith("example.com")
            })

            it("marks challenge as verified and attempt as success when token is present in TXT records", async () => {
                const challenge = makeChallenge({ challenge: "my-token" })
                mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(1)
                mocks.challengeRepo.findPendingChallenges.mockResolvedValue([challenge])
                mocks.domainRepo.findById.mockResolvedValue(makeDomainMock())
                mocks.challengeRepo.save.mockResolvedValue(challenge)
                mocks.attemptsRepo.insert.mockResolvedValue(undefined)
                mocks.webhookHandler.sendVerificationResult.mockResolvedValue(undefined)
                mockResolveTxt.mockResolvedValue([["my-token"]])

                await (worker as any).verifyDomains()

                expect(challenge.status).toBe(VerificationChallengeStatus.COMPLETE)
                const attempt = mocks.attemptsRepo.insert.mock.calls[0]![0]!
                expect(attempt.result).toBe(VerificationAttemptStatus.SUCCESS)
            })

            it("marks attempt as record_not_found when token is absent from TXT records", async () => {
                const challenge = makeChallenge({ challenge: "my-token" })
                mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(1)
                mocks.challengeRepo.findPendingChallenges.mockResolvedValue([challenge])
                mocks.domainRepo.findById.mockResolvedValue(makeDomainMock())
                mocks.challengeRepo.save.mockResolvedValue(challenge)
                mocks.attemptsRepo.insert.mockResolvedValue(undefined)
                mockResolveTxt.mockResolvedValue([["unrelated-record"]])

                await (worker as any).verifyDomains()

                const attempt = mocks.attemptsRepo.insert.mock.calls[0]![0]!
                expect(attempt.result).toBe(VerificationAttemptStatus.RECORD_NOT_FOUND)
                expect(challenge.status).toBe(VerificationChallengeStatus.PENDING)
                expect(mocks.challengeRepo.save).toHaveBeenCalledWith(challenge)
            })

            it("sets domain status to VERIFIED and saves it when challenge token is found", async () => {
                const challenge = makeChallenge({ challenge: "my-token", domain_id: 7 })
                const domain = makeDomainMock()
                mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(1)
                mocks.challengeRepo.findPendingChallenges.mockResolvedValue([challenge])
                mocks.domainRepo.findById.mockResolvedValue(domain)
                mocks.challengeRepo.save.mockResolvedValue(challenge)
                mocks.attemptsRepo.insert.mockResolvedValue(undefined)
                mocks.webhookHandler.sendVerificationResult.mockResolvedValue(undefined)
                mockResolveTxt.mockResolvedValue([["my-token"]])

                await (worker as any).verifyDomains()

                expect(domain.status).toBe(DomainStatus.VERIFIED)
                expect(mocks.domainRepo.save).toHaveBeenCalledWith(domain)
            })

            it("does not save the domain when token is not found in records", async () => {
                const challenge = makeChallenge({ challenge: "my-token" })
                mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(1)
                mocks.challengeRepo.findPendingChallenges.mockResolvedValue([challenge])
                mocks.domainRepo.findById.mockResolvedValue(makeDomainMock())
                mocks.challengeRepo.save.mockResolvedValue(challenge)
                mocks.attemptsRepo.insert.mockResolvedValue(undefined)
                mockResolveTxt.mockResolvedValue([["wrong-token"]])

                await (worker as any).verifyDomains()

                expect(mocks.domainRepo.save).not.toHaveBeenCalled()
            })

            it("trims whitespace from TXT records before comparing", async () => {
                const challenge = makeChallenge({ challenge: "my-token", domain_id: 5 })
                const domain = makeDomainMock()
                mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(1)
                mocks.challengeRepo.findPendingChallenges.mockResolvedValue([challenge])
                mocks.domainRepo.findById.mockResolvedValue(domain)
                mocks.challengeRepo.save.mockResolvedValue(challenge)
                mocks.attemptsRepo.insert.mockResolvedValue(undefined)
                mocks.webhookHandler.sendVerificationResult.mockResolvedValue(undefined)
                mockResolveTxt.mockResolvedValue([["  my-token  "]])

                await (worker as any).verifyDomains()

                expect(challenge.status).toBe(VerificationChallengeStatus.COMPLETE)
                expect(domain.status).toBe(DomainStatus.VERIFIED)
            })

            it("matches token across multiple TXT record sets", async () => {
                const challenge = makeChallenge({ challenge: "my-token" })
                mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(1)
                mocks.challengeRepo.findPendingChallenges.mockResolvedValue([challenge])
                mocks.domainRepo.findById.mockResolvedValue(makeDomainMock())
                mocks.challengeRepo.save.mockResolvedValue(challenge)
                mocks.attemptsRepo.insert.mockResolvedValue(undefined)
                mocks.webhookHandler.sendVerificationResult.mockResolvedValue(undefined)
                mockResolveTxt.mockResolvedValue([["v=spf1 include:example.com ~all"], ["my-token"]])

                await (worker as any).verifyDomains()

                expect(challenge.status).toBe(VerificationChallengeStatus.COMPLETE)
            })
        })

        // ── isRunning flag ────────────────────────────────────────────────────

        describe("isRunning flag", () => {
            it("resets isRunning to false after successful processing", async () => {
                mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(1)
                mocks.challengeRepo.findPendingChallenges.mockResolvedValue([makeChallenge()])
                mocks.domainRepo.findById.mockResolvedValue(makeDomainMock())
                mocks.challengeRepo.save.mockResolvedValue(makeChallenge() as any)
                mocks.attemptsRepo.insert.mockResolvedValue(undefined)
                mockResolveTxt.mockResolvedValue([])

                await (worker as any).verifyDomains()

                expect((worker as any).isRunning).toBe(false)
            })

            it("resets isRunning to false after a repository error", async () => {
                mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(1)
                mocks.challengeRepo.findPendingChallenges.mockRejectedValue(new Error("DB connection lost"))

                await (worker as any).verifyDomains()

                expect((worker as any).isRunning).toBe(false)
            })

            it("resets isRunning to false after a DNS error", async () => {
                mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(1)
                mocks.challengeRepo.findPendingChallenges.mockResolvedValue([makeChallenge()])
                mocks.domainRepo.findById.mockResolvedValue(makeDomainMock())
                mockResolveTxt.mockRejectedValue(new Error("ENOTFOUND"))

                await (worker as any).verifyDomains()

                expect((worker as any).isRunning).toBe(false)
            })

            it("resets isRunning to false when there are no pending challenges", async () => {
                mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(0)

                await (worker as any).verifyDomains()

                expect((worker as any).isRunning).toBe(false)
            })
        })

        // ── error handling ────────────────────────────────────────────────────

        describe("error handling", () => {
            it("logs the error and does not throw when DNS resolution fails", async () => {
                const errorSpy = jest.spyOn(logger, "error").mockImplementation(() => logger)
                mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(1)
                mocks.challengeRepo.findPendingChallenges.mockResolvedValue([makeChallenge()])
                mocks.domainRepo.findById.mockResolvedValue(makeDomainMock())
                mockResolveTxt.mockRejectedValue(new Error("ENOTFOUND example.com"))

                await expect((worker as any).verifyDomains()).resolves.not.toThrow()
                expect(errorSpy).toHaveBeenCalled()
                errorSpy.mockRestore()
            })

            it("logs the error and does not throw when a repository call fails", async () => {
                const errorSpy = jest.spyOn(logger, "error").mockImplementation(() => logger)
                mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(1)
                mocks.challengeRepo.findPendingChallenges.mockRejectedValue(new Error("DB timeout"))

                await expect((worker as any).verifyDomains()).resolves.not.toThrow()
                expect(errorSpy).toHaveBeenCalled()
                errorSpy.mockRestore()
            })
        })

        // ── mixed batch ───────────────────────────────────────────────────────

        describe("mixed batch of expired and valid challenges", () => {
            it("handles each challenge independently: expired → failed, valid → DNS lookup", async () => {
                const expired = makeChallenge({ id: 1, expires_at: new Date("2024-01-01T00:00:00.000Z") })
                const valid = makeChallenge({ id: 2, challenge: "token" })
                mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(2)
                mocks.challengeRepo.findPendingChallenges.mockResolvedValue([expired, valid])
                mocks.attemptsRepo.insert.mockResolvedValue(undefined)
                mocks.challengeRepo.save.mockResolvedValue(makeChallenge() as any)
                mocks.domainRepo.findById.mockResolvedValue(makeDomainMock())
                mockResolveTxt.mockResolvedValue([])

                await (worker as any).verifyDomains()

                expect(expired.status).toBe(VerificationChallengeStatus.FAILED)
                expect(mockResolveTxt).toHaveBeenCalledTimes(1)
                expect(mocks.attemptsRepo.insert).toHaveBeenCalledTimes(2)
            })
        })

        describe("DNS error batch behaviour", () => {
            it("catches DNS errors per-challenge and inserts RECORD_NOT_FOUND attempts for both", async () => {
                const first = makeChallenge({ id: 1 })
                const second = makeChallenge({ id: 2 })
                mocks.challengeRepo.getPendingChallengesCount.mockResolvedValue(2)
                mocks.challengeRepo.findPendingChallenges.mockResolvedValue([first, second])
                mocks.domainRepo.findById.mockResolvedValue(makeDomainMock())
                mocks.challengeRepo.save.mockResolvedValue(makeChallenge() as any)
                mocks.attemptsRepo.insert.mockResolvedValue(undefined)
                // Both DNS calls reject — errors are caught inside each per-challenge callback,
                // so each attempt is still inserted with RECORD_NOT_FOUND status.
                mockResolveTxt.mockRejectedValue(new Error("ENOTFOUND"))

                await (worker as any).verifyDomains()

                expect(mockResolveTxt).toHaveBeenCalledTimes(2)
                expect(mocks.attemptsRepo.insert).toHaveBeenCalledTimes(2)
                const results = mocks.attemptsRepo.insert.mock.calls.map((c: any) => c[0].result)
                expect(results).toEqual([VerificationAttemptStatus.RECORD_NOT_FOUND, VerificationAttemptStatus.RECORD_NOT_FOUND])
            })
        })
    })
})
