import { Request, Response, NextFunction } from "express"
import { ApiError, ErrorCode } from "../error"
import { ValidateError } from "@tsoa/runtime"
import { logger } from "../utils"

/**
 * Middleware to handle API errors.
 * 
 * If the error is an instance of ApiError,
 * it sends a response with the appropriate status code and message.
 * Otherwise, it sends a generic internal server error response.
 * 
 * @param err The error object.
 * @param _req The incoming request object.
 * @param res The outgoing response object.
 * @param _next The next middleware function in the stack.
 * @returns Sends a JSON response with the error details.
 */
export const apiErrorMiddleware = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ApiError) {
        logger.warn(`API Error: ${err.stack || err.message}`)
        res.status(err.errorCode).json({
            status: "error",
            data: err.message
        })
        return
    }

    if (err instanceof ValidateError) {
        logger.warn(`Validation Error: ${JSON.stringify(err.fields)}`)
        res.status(ErrorCode.InvalidRequest).json({
            status: "error",
            data: "Invalid request parameters",
            fields: err.fields
        })
        return
    }

    logger.error(`Unexpected Error: ${err instanceof Error ? err.stack : JSON.stringify(err)}`)

    res.status(ErrorCode.InternalServerError).json({
        status: "error",
        data: (err as Error).message || "Internal server error"
    })
}