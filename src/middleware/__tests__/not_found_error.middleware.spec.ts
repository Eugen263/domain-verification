import { jest, describe, it, expect } from "@jest/globals"
import { notFoundErrorMiddleware } from "../not_found_error.middleware"
import { ApiError, ErrorCode } from "@app/error"
import type { Request, Response, NextFunction } from "express"

describe("notFoundErrorMiddleware", () => {
    it("calls next with an ApiError", () => {
        const next = jest.fn() as unknown as NextFunction

        notFoundErrorMiddleware({} as Request, {} as Response, next)

        expect(next).toHaveBeenCalledWith(expect.any(ApiError))
    })

    it("passes a 404 status code", () => {
        const next = jest.fn() as unknown as NextFunction

        notFoundErrorMiddleware({} as Request, {} as Response, next)

        const err = (next as jest.Mock).mock.calls[0][0] as ApiError
        expect(err.errorCode).toBe(ErrorCode.NotFound)
    })

    it("passes 'Resource not found' as the message", () => {
        const next = jest.fn() as unknown as NextFunction

        notFoundErrorMiddleware({} as Request, {} as Response, next)

        const err = (next as jest.Mock).mock.calls[0][0] as ApiError
        expect(err.message).toBe("Resource not found")
    })
})
