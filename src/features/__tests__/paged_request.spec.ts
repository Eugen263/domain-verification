import { describe, it, expect } from "@jest/globals"
import { PagedRequest } from "../dto"

describe("PagedRequest", () => {
    describe("limitValue", () => {
        it("defaults to 20 when no limit is provided", () => {
            expect(new PagedRequest().limitValue).toBe(20)
        })

        it("returns the provided limit", () => {
            expect(new PagedRequest(1, 50).limitValue).toBe(50)
        })
    })

    describe("pageValue", () => {
        it("defaults to 1 when no page is provided", () => {
            expect(new PagedRequest().pageValue).toBe(1)
        })

        it("returns the provided page", () => {
            expect(new PagedRequest(3).pageValue).toBe(3)
        })
    })

    describe("offsetValue", () => {
        it("is 0 for the first page", () => {
            expect(new PagedRequest(1, 20).offsetValue).toBe(0)
        })

        it("is 20 for the second page with limit 20", () => {
            expect(new PagedRequest(2, 20).offsetValue).toBe(20)
        })

        it("is 40 for the third page with limit 20", () => {
            expect(new PagedRequest(3, 20).offsetValue).toBe(40)
        })

        it("uses default page and limit when neither is provided", () => {
            // page=1, limit=20 → offset=0
            expect(new PagedRequest().offsetValue).toBe(0)
        })

        it("uses default limit when only page is provided", () => {
            // page=2, limit=20 (default) → offset=20
            expect(new PagedRequest(2).offsetValue).toBe(20)
        })
    })
})
