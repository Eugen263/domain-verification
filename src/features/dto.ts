import { IsInt } from "class-validator"
import { TDomainStatus, TVerificationChallengeStatus } from "../domain/value_object"
import { FieldErrors, ValidateError } from "@tsoa/runtime"

export interface IApiError {
    status: "error",
    data?: unknown,
    fields?: Record<string, string>,
}

export interface IDomainDTO {
    id: number
    domain: string
    owner_id: number
    status: TDomainStatus
    createdAt: Date
    updatedAt: Date
}

export interface IChallengeDTO {
    id: number
    challenge: string
    status: TVerificationChallengeStatus
    expiresAt: Date
    createdAt: Date
    updatedAt: Date
}

export interface IVerificationAttemptDTO {
    id: number,
    result: string,
    checkedAt: Date,
}

export class PagedRequest {
    private page?: number
    private limit?: number
    
    constructor(page?: number, limit?: number) {
        this.page = page
        this.limit = limit
        this.validate()
    }

    private validate() {
        let errors: FieldErrors = {}

        if (this.page !== undefined && (isNaN(this.page) || this.page < 1)) {
            errors.page = { message: "Page must be a positive integer" }
        }
        if (this.limit !== undefined && (isNaN(this.limit) || this.limit < 1)) {
            errors.limit = { message: "Limit must be a positive integer" }
        }

        if (Object.keys(errors).length > 0) {
            throw new ValidateError(errors, "Invalid query parameters")
        }
    }

    get limitValue(): number {
        return this.limit ?? 20
    }

    get pageValue(): number {
        return this.page ?? 1
    }

    get offsetValue(): number {
        return (this.pageValue - 1) * this.limitValue
    }
}

export interface IPagedResponse<T> {
    data: T[]
    total: number
    page: number
    limit: number
}