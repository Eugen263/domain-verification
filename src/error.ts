export enum ErrorCode {
    InvalidRequest = 400,
    NotFound = 404,
    Conflict = 409,
    TooManyRequests = 429,
    InternalServerError = 500,
}

export class ApiError extends Error {
    constructor(
        public readonly errorCode: ErrorCode,
        public readonly message: string,
    ) {
        super(message)
        this.name = "ApiError"
    }
}
