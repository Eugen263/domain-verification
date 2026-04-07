import { env } from "@app/env"
import { VerificationChallengeStatus } from "../value_object"

export class VerificationChallenge {
    id: number
    domain_id: number
    challenge: string
    status: VerificationChallengeStatus
    expires_at: Date
    created_at: Date
    updated_at: Date

    constructor(
        id: number,
        domain_id: number,
        challenge: string,
        status: VerificationChallengeStatus,
        expires_at: Date,
        created_at: Date,
        updated_at: Date
    ) {
        this.id = id
        this.domain_id = domain_id
        this.challenge = challenge
        this.status = status
        this.expires_at = expires_at
        this.created_at = created_at
        this.updated_at = updated_at
    }

    /**
     * Generates a random challenge string for domain verification.
     * This string is used to verify ownership of the domain by requiring the owner to add it to their DNS records.
     * 
     * @returns A random string that can be used as a challenge for domain verification.
     */
    private static generateChallenge(): string {
        const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        const bytes = crypto.getRandomValues(new Uint8Array(128))
        return Array.from(bytes, (b) => charset[b % charset.length]).join("")
    }

    static create(domain_id: number): VerificationChallenge {
        const challenge = this.generateChallenge()
        const now = new Date()

        // Set the expiration time for the verification challenge based on the configured TTL
        const verificationTTL = now.getTime() + env.DOMAIN_VERIFICATION_TTL * 1000
        const expires_at = new Date(verificationTTL)

        return new VerificationChallenge(
            0,
            domain_id,
            challenge,
            VerificationChallengeStatus.PENDING,
            expires_at,
            now,
            now
        )
    }

    isExpired(): boolean {
        return new Date() > this.expires_at
    }

    isVerified(): boolean {
        return this.status === VerificationChallengeStatus.COMPLETE
    }

    markAsVerified() {
        this.status = VerificationChallengeStatus.COMPLETE
        this.updated_at = new Date()
    }

    markAsFailed() {
        this.status = VerificationChallengeStatus.FAILED
        this.updated_at = new Date()
    }
}