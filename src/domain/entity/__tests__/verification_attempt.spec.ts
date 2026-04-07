import { describe, it, expect } from "@jest/globals"
import { VerificationAttempt } from "../verification_attempt"
import { VerificationAttemptStatus } from "../../value_object/verification_attempt_status"

describe("VerificationAttempt.create", () => {
    it("sets id to 0 (unassigned until persisted)", () => {
        expect(VerificationAttempt.create(1).id).toBe(0)
    })

    it("stores the provided challenge id", () => {
        expect(VerificationAttempt.create(7).challenge_id).toBe(7)
    })

    it("defaults result to FAILED", () => {
        expect(VerificationAttempt.create(1).result).toBe(VerificationAttemptStatus.FAILED)
    })

    it("leaves dns_response undefined", () => {
        expect(VerificationAttempt.create(1).dns_response).toBeUndefined()
    })

    it("sets checked_at to approximately now", () => {
        const before = new Date()
        const attempt = VerificationAttempt.create(1)
        const after = new Date()
        expect(attempt.checked_at.getTime()).toBeGreaterThanOrEqual(before.getTime())
        expect(attempt.checked_at.getTime()).toBeLessThanOrEqual(after.getTime())
    })
})

describe("VerificationAttempt.markAsSuccess", () => {
    it("sets result to SUCCESS", () => {
        const attempt = VerificationAttempt.create(1)
        attempt.markAsSuccess("[[token]]")
        expect(attempt.result).toBe(VerificationAttemptStatus.SUCCESS)
    })

    it("stores the provided dns_response", () => {
        const attempt = VerificationAttempt.create(1)
        attempt.markAsSuccess("[[my-token]]")
        expect(attempt.dns_response).toBe("[[my-token]]")
    })

    it("overwrites a previously set dns_response", () => {
        const attempt = VerificationAttempt.create(1)
        attempt.markAsSuccess("first")
        attempt.markAsSuccess("second")
        expect(attempt.dns_response).toBe("second")
    })
})

describe("VerificationAttempt.markAsRecordNotFound", () => {
    it("sets result to RECORD_NOT_FOUND", () => {
        const attempt = VerificationAttempt.create(1)
        attempt.markAsRecordNotFound()
        expect(attempt.result).toBe(VerificationAttemptStatus.RECORD_NOT_FOUND)
    })

    it("does not modify dns_response", () => {
        const attempt = VerificationAttempt.create(1)
        attempt.markAsRecordNotFound()
        expect(attempt.dns_response).toBeUndefined()
    })
})

describe("VerificationAttempt.addDnsResponse", () => {
    it("sets dns_response when it was previously undefined", () => {
        const attempt = VerificationAttempt.create(1)
        attempt.addDnsResponse("part1")
        expect(attempt.dns_response).toBe("part1")
    })

    it("appends to an existing dns_response with a newline separator", () => {
        const attempt = new VerificationAttempt(0, 1, VerificationAttemptStatus.FAILED, new Date(), "first")
        attempt.addDnsResponse("second")
        expect(attempt.dns_response).toBe("first\nsecond")
    })
})
