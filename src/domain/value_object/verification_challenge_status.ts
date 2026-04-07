export enum VerificationChallengeStatus {
    FAILED = "failed",
    PENDING = "pending",
    COMPLETE = "complete",
}

export type TVerificationChallengeStatus = typeof VerificationChallengeStatus[keyof typeof VerificationChallengeStatus]