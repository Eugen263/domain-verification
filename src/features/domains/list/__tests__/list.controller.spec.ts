import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import { ValidateError } from "@tsoa/runtime"

;(jest as any).unstable_mockModule("@app/env", () => ({
    env: { DOMAIN_VERIFICATION_TTL: 3600 },
}))

const { ListDomainsController } = await import("../list.controller")
const { PagedRequest } = await import("@app/features/dto")

type PagedResponse = { data: unknown[]; total: number; page: number; limit: number }

describe("ListDomainsController.list", () => {
    let handler: { execute: jest.Mock<(req: InstanceType<typeof PagedRequest>) => Promise<PagedResponse>> }
    let controller: InstanceType<typeof ListDomainsController>

    beforeEach(() => {
        handler = { execute: jest.fn<(req: InstanceType<typeof PagedRequest>) => Promise<PagedResponse>>() }
        controller = new ListDomainsController(handler as any)
        handler.execute.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 })
    })

    // ── query parameter forwarding ────────────────────────────────────────────

    it("forwards page and limit to the handler as a PagedRequest", async () => {
        await controller.list(2, 5)

        const arg: InstanceType<typeof PagedRequest> = handler.execute.mock.calls[0][0]
        expect(arg.pageValue).toBe(2)
        expect(arg.limitValue).toBe(5)
    })

    it("uses page=1 and limit=20 when params are omitted", async () => {
        await controller.list()

        const arg: InstanceType<typeof PagedRequest> = handler.execute.mock.calls[0][0]
        expect(arg.pageValue).toBe(1)
        expect(arg.limitValue).toBe(20)
    })

    it("uses the default limit=20 when only page is provided", async () => {
        await controller.list(3)

        const arg: InstanceType<typeof PagedRequest> = handler.execute.mock.calls[0][0]
        expect(arg.pageValue).toBe(3)
        expect(arg.limitValue).toBe(20)
    })

    it("uses the default page=1 when only limit is provided", async () => {
        await controller.list(undefined, 5)

        const arg: InstanceType<typeof PagedRequest> = handler.execute.mock.calls[0][0]
        expect(arg.pageValue).toBe(1)
        expect(arg.limitValue).toBe(5)
    })

    it("accepts page=1 (minimum valid page)", async () => {
        await expect(controller.list(1, 10)).resolves.not.toThrow()
    })

    it("accepts limit=1 (minimum valid limit)", async () => {
        await expect(controller.list(1, 1)).resolves.not.toThrow()
    })

    // ── invalid pagination ────────────────────────────────────────────────────

    it("throws ValidateError when page=0", async () => {
        await expect(controller.list(0, 10)).rejects.toThrow(ValidateError)
    })

    it("includes a 'page' field error when page=0", async () => {
        await expect(controller.list(0, 10))
            .rejects.toMatchObject({ fields: expect.objectContaining({ page: expect.any(Object) }) })
    })

    it("throws ValidateError when page is negative", async () => {
        await expect(controller.list(-1, 10)).rejects.toThrow(ValidateError)
    })

    it("throws ValidateError when limit=0", async () => {
        await expect(controller.list(1, 0)).rejects.toThrow(ValidateError)
    })

    it("throws ValidateError when limit is negative", async () => {
        await expect(controller.list(1, -1)).rejects.toThrow(ValidateError)
    })

    it("includes a 'limit' field error when limit is invalid", async () => {
        await expect(controller.list(1, 0))
            .rejects.toMatchObject({ fields: expect.objectContaining({ limit: expect.any(Object) }) })
    })

    it("does not call the handler when pagination params are invalid", async () => {
        await controller.list(0, 10).catch(() => {})

        expect(handler.execute).not.toHaveBeenCalled()
    })

    // ── response ──────────────────────────────────────────────────────────────

    it("returns the handler result directly", async () => {
        const response = { data: [{ id: 1 }], total: 1, page: 1, limit: 20 }
        handler.execute.mockResolvedValue(response)

        const result = await controller.list()

        expect(result).toBe(response)
    })
})
