import { describe, it, expect } from "@jest/globals"
import { DomainStatus, toDomainStatus } from "../domain_status"

describe("toDomainStatus", () => {
    it('maps "pending" to DomainStatus.PENDING', () => {
        expect(toDomainStatus("pending")).toBe(DomainStatus.PENDING)
    })

    it('maps "verified" to DomainStatus.VERIFIED', () => {
        expect(toDomainStatus("verified")).toBe(DomainStatus.VERIFIED)
    })

    it('maps "expired" to DomainStatus.EXPIRED', () => {
        expect(toDomainStatus("expired")).toBe(DomainStatus.EXPIRED)
    })

    it("throws for an unknown status string", () => {
        expect(() => toDomainStatus("unknown")).toThrow("Invalid domain status: unknown")
    })

    it("throws for an empty string", () => {
        expect(() => toDomainStatus("")).toThrow()
    })

    it("is case-sensitive — rejects uppercase input", () => {
        expect(() => toDomainStatus("PENDING")).toThrow()
    })
})
