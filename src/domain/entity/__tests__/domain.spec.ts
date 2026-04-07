import { describe, it, expect } from "@jest/globals"
import { Domain } from "../domain"
import { DomainName } from "../../value_object/domain_name"
import { DomainStatus } from "../../value_object/domain_status"

describe("Domain.create", () => {
    it("sets id to 0 (unassigned until persisted)", () => {
        const domain = Domain.create(new DomainName("example.com"), 1)
        expect(domain.id).toBe(0)
    })

    it("sets status to PENDING", () => {
        const domain = Domain.create(new DomainName("example.com"), 1)
        expect(domain.status).toBe(DomainStatus.PENDING)
    })

    it("stores the provided domain name", () => {
        const name = new DomainName("example.com")
        const domain = Domain.create(name, 1)
        expect(domain.domain).toBe(name)
    })

    it("stores the provided owner id", () => {
        const domain = Domain.create(new DomainName("example.com"), 42)
        expect(domain.owner_id).toBe(42)
    })

    it("sets createdAt and updatedAt to the same timestamp", () => {
        const domain = Domain.create(new DomainName("example.com"), 1)
        expect(domain.createdAt).toEqual(domain.updatedAt)
    })

    it("sets createdAt to approximately now", () => {
        const before = new Date()
        const domain = Domain.create(new DomainName("example.com"), 1)
        const after = new Date()
        expect(domain.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
        expect(domain.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })
})
