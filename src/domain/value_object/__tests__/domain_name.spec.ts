import { describe, it, expect } from "@jest/globals"
import { DomainName } from "../domain_name"

describe("DomainName", () => {
    describe("constructor", () => {
        it("accepts a valid domain", () => {
            expect(() => new DomainName("example.com")).not.toThrow()
        })

        it("throws for a domain without a dot", () => {
            expect(() => new DomainName("example")).toThrow()
        })

        it("throws for an empty string", () => {
            expect(() => new DomainName("")).toThrow()
        })

        it("throws when the name starts with a hyphen", () => {
            expect(() => new DomainName("-example.com")).toThrow()
        })

        it("throws when the name ends with a hyphen before the dot", () => {
            expect(() => new DomainName("example-.com")).toThrow()
        })

        it("throws when the TLD is only one character", () => {
            expect(() => new DomainName("example.c")).toThrow()
        })

        it("accepts a subdomain", () => {
            expect(() => new DomainName("sub.example.com")).not.toThrow()
        })

        it("accepts a domain with hyphens in the middle", () => {
            expect(() => new DomainName("my-domain.com")).not.toThrow()
        })
    })

    describe("value", () => {
        it("returns the original domain string", () => {
            expect(new DomainName("example.com").value).toBe("example.com")
        })
    })

    describe("toString", () => {
        it("returns the domain string", () => {
            expect(new DomainName("example.com").toString()).toBe("example.com")
        })
    })

    describe("isValid", () => {
        const valid = ["example.com", "sub.example.com", "my-site.io", "a.co"]
        const invalid = ["example", "", "-bad.com", "bad-.com", "bad.c", "bad..com"]

        valid.forEach(domain => {
            it(`considers "${domain}" valid`, () => {
                expect(new DomainName(domain).isValid()).toBe(true)
            })
        })

        invalid.forEach(domain => {
            it(`rejects "${domain}"`, () => {
                expect(() => new DomainName(domain)).toThrow()
            })
        })
    })
})
