import { VerificationAttemptStatus } from "../value_object"

export class VerificationAttempt {
    id: number
    challenge_id: number
    result: VerificationAttemptStatus
    checked_at: Date
    dns_response?: string

    constructor(
        id: number,
        challenge_id: number,
        result: VerificationAttemptStatus,
        checked_at: Date,
        dns_response?: string
    ) {
        this.id = id
        this.challenge_id = challenge_id
        this.result = result
        this.checked_at = checked_at
        this.dns_response = dns_response
    }

    static create(challenge_id: number): VerificationAttempt {
        return new VerificationAttempt(
            0,
            challenge_id,
            VerificationAttemptStatus.FAILED,
            new Date(),
            undefined
        )
    }

    markAsSuccess(dns_response: string) {
        this.result = VerificationAttemptStatus.SUCCESS
        this.dns_response = dns_response
    }

    markAsRecordNotFound() {
        this.result = VerificationAttemptStatus.RECORD_NOT_FOUND
    }

    addDnsResponse(dns_response: string) {
        if (this.dns_response == undefined) {
            this.dns_response = dns_response
            return
        }
        this.dns_response += `\n${dns_response}`
    }
}