import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import { apiErrorMiddleware } from "../api_error.middleware"
import { ApiError, ErrorCode } from "@app/error"
import { ValidateError } from "@tsoa/runtime"
import type { Request, Response, NextFunction } from "express"

const makeRes = () => {
    const json = jest.fn()
    const status = jest.fn().mockReturnValue({ json })
    return { res: { status } as unknown as Response, json, status }
}

const req = {} as Request
let next: jest.Mock

beforeEach(() => {
    next = jest.fn()
})

describe("apiErrorMiddleware — ApiError", () => {
    it("responds with the error code from ApiError", () => {
        const { res, status } = makeRes()

        apiErrorMiddleware(new ApiError(ErrorCode.NotFound, "Domain not found"), req, res, next)

        expect(status).toHaveBeenCalledWith(ErrorCode.NotFound)
    })

    it("responds with status:error and the error message", () => {
        const { res, json } = makeRes()

        apiErrorMiddleware(new ApiError(ErrorCode.NotFound, "Domain not found"), req, res, next)

        expect(json).toHaveBeenCalledWith({ status: "error", data: "Domain not found" })
    })

    it("handles a 400 ApiError", () => {
        const { res, status } = makeRes()

        apiErrorMiddleware(new ApiError(ErrorCode.InvalidRequest, "Bad input"), req, res, next)

        expect(status).toHaveBeenCalledWith(ErrorCode.InvalidRequest)
    })

    it("does not call next", () => {
        const { res } = makeRes()

        apiErrorMiddleware(new ApiError(ErrorCode.NotFound, "Domain not found"), req, res, next)

        expect(next).not.toHaveBeenCalled()
    })
})

describe("apiErrorMiddleware — ValidateError", () => {
    it("responds with 400 for a ValidateError", () => {
        const { res, status } = makeRes()

        apiErrorMiddleware(
            new ValidateError({ field: { message: "required", value: undefined } }, "Validation failed"),
            req, res, next
        )

        expect(status).toHaveBeenCalledWith(ErrorCode.InvalidRequest)
    })

    it("responds with 'Invalid request parameters' message and fields for a ValidateError", () => {
        const { res, json } = makeRes()
        const fields = { name: { message: "too short", value: undefined } }

        apiErrorMiddleware(new ValidateError(fields, "Validation failed"), req, res, next)

        expect(json).toHaveBeenCalledWith(
            expect.objectContaining({ status: "error", data: "Invalid request parameters", fields })
        )
    })

    it("does not call next", () => {
        const { res } = makeRes()

        apiErrorMiddleware(
            new ValidateError({ field: { message: "required", value: undefined } }, "Validation failed"),
            req, res, next
        )

        expect(next).not.toHaveBeenCalled()
    })
})

describe("apiErrorMiddleware — unexpected error", () => {
    it("responds with 500 for an unknown Error", () => {
        const { res, status } = makeRes()

        apiErrorMiddleware(new Error("Something went wrong"), req, res, next)

        expect(status).toHaveBeenCalledWith(ErrorCode.InternalServerError)
    })

    it("includes the error message in the response body", () => {
        const { res, json } = makeRes()

        apiErrorMiddleware(new Error("Something went wrong"), req, res, next)

        expect(json).toHaveBeenCalledWith(
            expect.objectContaining({ status: "error", data: "Something went wrong" })
        )
    })

    it("responds with 500 for a non-Error thrown value", () => {
        const { res, status } = makeRes()

        apiErrorMiddleware({ code: 42 }, req, res, next)

        expect(status).toHaveBeenCalledWith(ErrorCode.InternalServerError)
    })

    it("does not call next", () => {
        const { res } = makeRes()

        apiErrorMiddleware(new Error("Something went wrong"), req, res, next)

        expect(next).not.toHaveBeenCalled()
    })
})
