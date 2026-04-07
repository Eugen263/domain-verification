import { describe, it, expect } from "@jest/globals"
import { VerificationAttemptStatus, toVerificationAttemptStatus } from "../verification_attempt_status"

describe("toVerificationAttemptStatus", () => {
    it('maps "failed" to FAILED', () => {
        expect(toVerificationAttemptStatus("failed")).toBe(VerificationAttemptStatus.FAILED)
    })

    it('maps "record_not_found" to RECORD_NOT_FOUND', () => {
        expect(toVerificationAttemptStatus("record_not_found")).toBe(VerificationAttemptStatus.RECORD_NOT_FOUND)
    })

    it('maps "success" to SUCCESS', () => {
        expect(toVerificationAttemptStatus("success")).toBe(VerificationAttemptStatus.SUCCESS)
    })

    it("throws for an unknown status string", () => {
        expect(() => toVerificationAttemptStatus("unknown")).toThrow("Invalid verification attempt status: unknown")
    })

    it("throws for an empty string", () => {
        expect(() => toVerificationAttemptStatus("")).toThrow()
    })

    it("is case-sensitive — rejects uppercase input", () => {
        expect(() => toVerificationAttemptStatus("FAILED")).toThrow()
    })
})
