import { Request, Response, NextFunction } from "express"
import { ApiError, ErrorCode } from "../error"

/**
 * Middleware to handle 404 Not Found errors when a route is not matched.
 * 
 * @param _req The incoming request object.
 * @param _res The outgoing response object.
 * @param next The next middleware function in the stack.
 * @returns Calls the next middleware with a 404 ApiError.
 */
export const notFoundErrorMiddleware = (_req: Request, _res: Response, next: NextFunction) => {
    return next(new ApiError(ErrorCode.NotFound, "Resource not found"))
}