import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals"
import { VerificationChallengeStatus } from "../../value_object/verification_challenge_status"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(jest as any).unstable_mockModule("@app/env", () => ({
    env: { DOMAIN_VERIFICATION_TTL: 3600 },
}))

const { VerificationChallenge } = await import("../verification_challenge")

const makeChallenge = (expiresAt: Date) =>
    new VerificationChallenge(1, 1, "abc", VerificationChallengeStatus.PENDING, expiresAt, new Date(), new Date())

describe("VerificationChallenge.create", () => {
    it("generates a challenge of exactly 128 characters", () => {
        const vc = VerificationChallenge.create(1)
        expect(vc.challenge).toHaveLength(128)
    })

    it("generates a challenge containing only alphanumeric characters (a-z, A-Z, 0-9)", () => {
        const vc = VerificationChallenge.create(1)
        expect(vc.challenge).toMatch(/^[a-zA-Z0-9]{128}$/)
    })

    it("generates a unique challenge each time", () => {
        const a = VerificationChallenge.create(1)
        const b = VerificationChallenge.create(1)
        expect(a.challenge).not.toBe(b.challenge)
    })
})

describe("VerificationChallenge.markAsVerified", () => {
    it("sets status to COMPLETE", () => {
        const vc = makeChallenge(new Date(Date.now() + 3600_000))
        vc.markAsVerified()
        expect(vc.status).toBe(VerificationChallengeStatus.COMPLETE)
    })

    it("updates updated_at to approximately now", () => {
        const before = new Date()
        const vc = makeChallenge(new Date(Date.now() + 3600_000))
        vc.markAsVerified()
        const after = new Date()
        expect(vc.updated_at.getTime()).toBeGreaterThanOrEqual(before.getTime())
        expect(vc.updated_at.getTime()).toBeLessThanOrEqual(after.getTime())
    })
})

describe("VerificationChallenge.markAsFailed", () => {
    it("sets status to FAILED", () => {
        const vc = makeChallenge(new Date(Date.now() + 3600_000))
        vc.markAsFailed()
        expect(vc.status).toBe(VerificationChallengeStatus.FAILED)
    })

    it("updates updated_at to approximately now", () => {
        const before = new Date()
        const vc = makeChallenge(new Date(Date.now() + 3600_000))
        vc.markAsFailed()
        const after = new Date()
        expect(vc.updated_at.getTime()).toBeGreaterThanOrEqual(before.getTime())
        expect(vc.updated_at.getTime()).toBeLessThanOrEqual(after.getTime())
    })
})

describe("VerificationChallenge.isExpired", () => {
    const NOW = new Date("2025-01-01T12:00:00.000Z")

    beforeEach(() => {
        jest.useFakeTimers()
        jest.setSystemTime(NOW.getTime())
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it("returns false when expires_at is in the future", () => {
        const vc = makeChallenge(new Date("2025-01-01T13:00:00.000Z"))
        expect(vc.isExpired()).toBe(false)
    })

    it("returns true when expires_at is in the past", () => {
        const vc = makeChallenge(new Date("2025-01-01T11:00:00.000Z"))
        expect(vc.isExpired()).toBe(true)
    })

    it("returns false when expires_at equals the current time (not yet past)", () => {
        const vc = makeChallenge(new Date(NOW))
        expect(vc.isExpired()).toBe(false)
    })

    it("returns true when expires_at is 1ms before the current time", () => {
        const vc = makeChallenge(new Date(NOW.getTime() - 1))
        expect(vc.isExpired()).toBe(true)
    })
})
