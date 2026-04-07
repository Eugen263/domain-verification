import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import { ValidateError } from "@tsoa/runtime"

;(jest as any).unstable_mockModule("@app/env", () => ({
    env: { DOMAIN_VERIFICATION_TTL: 3600 },
}))

const { RegisterDomainController } = await import("../register.controller")
const { Domain } = await import("@app/domain/entity/domain")
const { DomainName } = await import("@app/domain/value_object/domain_name")
const { DomainStatus } = await import("@app/domain/value_object/domain_status")
const { VerificationChallenge } = await import("@app/domain/entity/verification_challenge")
const { VerificationChallengeStatus } = await import("@app/domain/value_object/verification_challenge_status")
const { DomainWithChallenge } = await import("@app/domain/queries/domain_with_challenge")

type DomainWithChallengeInstance = InstanceType<typeof DomainWithChallenge>

const makeDomainWithChallenge = () => {
    const now = new Date()
    const domain = new Domain(1, new DomainName("example.com"), 42, DomainStatus.PENDING, now, now)
    const challenge = new VerificationChallenge(
        5, 1, "challenge-token",
        VerificationChallengeStatus.PENDING,
        new Date(Date.now() + 3600_000), now, now
    )
    return DomainWithChallenge.fromDomainAndChallenge(domain, challenge)
}

describe("RegisterDomainController.register", () => {
    let handler: { execute: jest.Mock<(domain: string, owner: number) => Promise<DomainWithChallengeInstance>> }
    let controller: InstanceType<typeof RegisterDomainController>

    beforeEach(() => {
        handler = { execute: jest.fn<(domain: string, owner: number) => Promise<DomainWithChallengeInstance>>() }
        controller = new RegisterDomainController(handler as any)
    })

    // ── body validation ───────────────────────────────────────────────────────

    it("throws ValidateError when domain has no dot", async () => {
        await expect(controller.register({ domain: "nodot", owner: 1 } as any))
            .rejects.toThrow(ValidateError)
    })

    it("includes the domain field in the error when domain has no dot", async () => {
        await expect(controller.register({ domain: "nodot", owner: 1 } as any))
            .rejects.toMatchObject({ fields: expect.objectContaining({ domain: expect.any(Object) }) })
    })

    it("throws ValidateError when domain is an empty string", async () => {
        await expect(controller.register({ domain: "", owner: 1 } as any))
            .rejects.toThrow(ValidateError)
    })

    it("throws ValidateError when domain exceeds 255 characters", async () => {
        await expect(controller.register({ domain: "a".repeat(256), owner: 1 } as any))
            .rejects.toThrow(ValidateError)
    })

    it("throws ValidateError when owner is a float", async () => {
        await expect(controller.register({ domain: "example.com", owner: 1.5 } as any))
            .rejects.toMatchObject({ fields: expect.objectContaining({ owner: expect.any(Object) }) })
    })

    it("throws ValidateError when owner is missing", async () => {
        await expect(controller.register({ domain: "example.com" } as any))
            .rejects.toThrow(ValidateError)
    })

    it("throws ValidateError when domain is null", async () => {
        await expect(controller.register({ domain: null, owner: 1 } as any))
            .rejects.toThrow(ValidateError)
    })

    it("throws ValidateError when owner is null", async () => {
        await expect(controller.register({ domain: "example.com", owner: null } as any))
            .rejects.toThrow(ValidateError)
    })

    it("throws ValidateError when body is completely empty", async () => {
        const err: ValidateError = await controller.register({} as any).catch(e => e)
        expect(err).toBeInstanceOf(ValidateError)
        expect(err.fields).toHaveProperty("domain")
        expect(err.fields).toHaveProperty("owner")
    })

    it("throws ValidateError when owner is a numeric string", async () => {
        // @IsInt requires an actual number type — "1" is a string and must fail
        await expect(controller.register({ domain: "example.com", owner: "1" } as any))
            .rejects.toMatchObject({ fields: expect.objectContaining({ owner: expect.any(Object) }) })
    })

    it("accepts a domain of exactly 255 characters containing a dot", async () => {
        // 255 chars: 252 'a's + '.com' — boundary value should pass Length(1, 255)
        const domain = "a".repeat(251) + ".com"
        handler.execute.mockResolvedValue(makeDomainWithChallenge())

        await expect(controller.register({ domain, owner: 1 } as any)).resolves.not.toThrow()
    })

    it("does not call the handler when validation fails", async () => {
        await controller.register({ domain: "nodot", owner: 1 } as any).catch(() => {})

        expect(handler.execute).not.toHaveBeenCalled()
    })

    // ── happy path ────────────────────────────────────────────────────────────

    it("calls the handler with domain and owner from the body", async () => {
        handler.execute.mockResolvedValue(makeDomainWithChallenge())

        await controller.register({ domain: "example.com", owner: 42 } as any)

        expect(handler.execute).toHaveBeenCalledWith("example.com", 42)
    })

    it("returns id, domain, and challenge id from the mapped response", async () => {
        handler.execute.mockResolvedValue(makeDomainWithChallenge())

        const result = await controller.register({ domain: "example.com", owner: 42 } as any)

        expect(result.id).toBe(1)
        expect(result.domain).toBe("example.com")
        expect(result.challenge.id).toBe(5)
    })
})
