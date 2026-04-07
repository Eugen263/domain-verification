import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import { DomainStatus } from "../../../domain/value_object/domain_status"

type FetchResponse = { ok: boolean; status?: number; text?: () => Promise<string> }
const mockFetch = jest.fn<(url: string, options?: RequestInit) => Promise<FetchResponse>>()
const mockEnv = { WEBHOOK_URL: "https://hooks.example.com/verify" }

;(jest as any).unstable_mockModule("@app/env", () => ({
    env: mockEnv,
}))

const { WebhookHandler } = await import("../webhook.handler")
const { WebhookMessage } = await import("../webhook.dto")
const { logger } = await import("@app/utils")

const makeMessage = () => new WebhookMessage(1, "example.com", 42, DomainStatus.VERIFIED)

describe("WebhookHandler.sendVerificationResult", () => {
    let handler: InstanceType<typeof WebhookHandler>

    beforeEach(() => {
        handler = new WebhookHandler()
        mockFetch.mockReset()
        mockEnv.WEBHOOK_URL = "https://hooks.example.com/verify"
        ;(global as any).fetch = mockFetch
    })

    // ── env guard ─────────────────────────────────────────────────────────────

    it("does nothing when WEBHOOK_URL is not configured", async () => {
        mockEnv.WEBHOOK_URL = ""

        await handler.sendVerificationResult(makeMessage())

        expect(mockFetch).not.toHaveBeenCalled()
    })

    // ── happy path ────────────────────────────────────────────────────────────

    it("sends a POST request to WEBHOOK_URL", async () => {
        mockFetch.mockResolvedValue({ ok: true })

        await handler.sendVerificationResult(makeMessage())

        expect(mockFetch).toHaveBeenCalledWith(
            "https://hooks.example.com/verify",
            expect.objectContaining({ method: "POST" })
        )
    })

    it("sends Content-Type: application/json header", async () => {
        mockFetch.mockResolvedValue({ ok: true })

        await handler.sendVerificationResult(makeMessage())

        expect(mockFetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: { "Content-Type": "application/json" },
            })
        )
    })

    it("serialises the message as JSON in the request body", async () => {
        const msg = makeMessage()
        mockFetch.mockResolvedValue({ ok: true })

        await handler.sendVerificationResult(msg)

        expect(mockFetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ body: JSON.stringify(msg.toJSON()) })
        )
    })

    it("does not throw when the response is ok", async () => {
        mockFetch.mockResolvedValue({ ok: true })

        await expect(handler.sendVerificationResult(makeMessage())).resolves.not.toThrow()
    })

    // ── non-ok response ───────────────────────────────────────────────────────

    it("logs an error when the response status is not ok", async () => {
        const errorSpy = jest.spyOn(logger, "error").mockImplementation(() => logger)
        mockFetch.mockResolvedValue({ ok: false, status: 500, text: async () => "Internal Server Error" })

        await handler.sendVerificationResult(makeMessage())

        expect(errorSpy).toHaveBeenCalled()
        errorSpy.mockRestore()
    })

    it("does not throw when the response status is not ok", async () => {
        jest.spyOn(logger, "error").mockImplementation(() => logger)
        mockFetch.mockResolvedValue({ ok: false, status: 503, text: async () => "Service Unavailable" })

        await expect(handler.sendVerificationResult(makeMessage())).resolves.not.toThrow()
        jest.restoreAllMocks()
    })

    // ── network error ─────────────────────────────────────────────────────────

    it("logs an error when fetch throws a network error", async () => {
        const errorSpy = jest.spyOn(logger, "error").mockImplementation(() => logger)
        mockFetch.mockRejectedValue(new Error("ECONNREFUSED"))

        await handler.sendVerificationResult(makeMessage())

        expect(errorSpy).toHaveBeenCalled()
        errorSpy.mockRestore()
    })

    it("does not throw when fetch throws a network error", async () => {
        jest.spyOn(logger, "error").mockImplementation(() => logger)
        mockFetch.mockRejectedValue(new Error("ECONNREFUSED"))

        await expect(handler.sendVerificationResult(makeMessage())).resolves.not.toThrow()
        jest.restoreAllMocks()
    })
})
