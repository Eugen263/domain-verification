import { describe, it, expect } from "@jest/globals"
import { WebhookMessage } from "../webhook.dto"
import { Domain } from "../../../domain/entity/domain"
import { DomainName } from "../../../domain/value_object/domain_name"
import { DomainStatus } from "../../../domain/value_object/domain_status"

describe("WebhookMessage.fromDomain", () => {
    it("maps all Domain fields correctly", () => {
        const domain = new Domain(5, new DomainName("example.com"), 99, DomainStatus.VERIFIED, new Date(), new Date())
        const msg = WebhookMessage.fromDomain(domain)

        expect(msg.id).toBe(5)
        expect(msg.domain).toBe("example.com")
        expect(msg.owner_id).toBe(99)
        expect(msg.status).toBe(DomainStatus.VERIFIED)
    })
})

describe("WebhookMessage.toJSON", () => {
    it("returns a plain object with all fields", () => {
        const msg = new WebhookMessage(1, "example.com", 42, DomainStatus.VERIFIED)

        expect(msg.toJSON()).toEqual({
            id: 1,
            domain: "example.com",
            owner_id: 42,
            status: DomainStatus.VERIFIED,
        })
    })

    it("roundtrips through fromDomain and toJSON", () => {
        const domain = new Domain(7, new DomainName("test.io"), 3, DomainStatus.PENDING, new Date(), new Date())
        const json = WebhookMessage.fromDomain(domain).toJSON()

        expect(json).toEqual({
            id: 7,
            domain: "test.io",
            owner_id: 3,
            status: DomainStatus.PENDING,
        })
    })
})
