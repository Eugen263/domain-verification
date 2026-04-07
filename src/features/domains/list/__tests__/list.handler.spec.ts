import { jest, describe, it, expect, beforeEach } from "@jest/globals"

;(jest as any).unstable_mockModule("@app/env", () => ({
    env: { DOMAIN_VERIFICATION_TTL: 3600 },
}))

const { ListDomainsHandler } = await import("../list.handler")
const { PagedRequest } = await import("@app/features/dto")
const { Domain } = await import("@app/domain/entity/domain")
const { DomainName } = await import("@app/domain/value_object/domain_name")
const { DomainStatus } = await import("@app/domain/value_object/domain_status")

type DomainInstance = InstanceType<typeof Domain>
type ListResult = { domains: DomainInstance[]; total: number }

const makeDomain = (id: number, name: string) =>
    new Domain(id, new DomainName(name), 1, DomainStatus.PENDING, new Date(), new Date())

describe("ListDomainsHandler.execute", () => {
    let domainRepo: { list: jest.Mock<(offset: number, limit: number) => Promise<ListResult>> }
    let handler: InstanceType<typeof ListDomainsHandler>

    beforeEach(() => {
        domainRepo = { list: jest.fn<(offset: number, limit: number) => Promise<ListResult>>() }
        handler = new ListDomainsHandler(domainRepo as any)
    })

    it("returns mapped domain DTOs and total count", async () => {
        const domains = [makeDomain(1, "example.com"), makeDomain(2, "test.io")]
        domainRepo.list.mockResolvedValue({ domains, total: 2 })

        const result = await handler.execute(new PagedRequest(1, 10))

        expect(result.total).toBe(2)
        expect(result.data).toHaveLength(2)
        expect(result.data[0].domain).toBe("example.com")
        expect(result.data[1].domain).toBe("test.io")
    })

    it("passes offset and limit derived from PagedRequest", async () => {
        domainRepo.list.mockResolvedValue({ domains: [], total: 0 })

        await handler.execute(new PagedRequest(3, 5))

        // page=3, limit=5 → offset=(3-1)*5=10
        expect(domainRepo.list).toHaveBeenCalledWith(10, 5)
    })

    it("uses default limit=20 and offset=0 when page and limit are not specified", async () => {
        domainRepo.list.mockResolvedValue({ domains: [], total: 0 })

        await handler.execute(new PagedRequest())

        expect(domainRepo.list).toHaveBeenCalledWith(0, 20)
    })

    it("returns the correct page and limit values in the response", async () => {
        domainRepo.list.mockResolvedValue({ domains: [], total: 0 })

        const result = await handler.execute(new PagedRequest(2, 10))

        expect(result.page).toBe(2)
        expect(result.limit).toBe(10)
    })

    it("returns empty data array when there are no domains", async () => {
        domainRepo.list.mockResolvedValue({ domains: [], total: 0 })

        const result = await handler.execute(new PagedRequest())

        expect(result.data).toEqual([])
        expect(result.total).toBe(0)
    })
})
