export enum VerificationAttemptStatus {
    FAILED = "failed",
    RECORD_NOT_FOUND = "record_not_found",
    SUCCESS = "success"
}

export const toVerificationAttemptStatus = (status: string): VerificationAttemptStatus => {
    switch (status) {
        case "failed":
            return VerificationAttemptStatus.FAILED
        case "record_not_found":
            return VerificationAttemptStatus.RECORD_NOT_FOUND
        case "success":
            return VerificationAttemptStatus.SUCCESS
        default:
            throw new Error(`Invalid verification attempt status: ${status}`)
    }
}