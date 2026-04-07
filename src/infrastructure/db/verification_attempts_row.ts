import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm"

import { VerificationChallengeRow } from "./verification_challenge_row"
import { VerificationAttempt } from "@app/domain/entity"
import { toVerificationAttemptStatus } from "@app/domain/value_object"

@Entity("verification_attempts")
export class VerificationAttemptsRow {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => VerificationChallengeRow, { onDelete: "CASCADE" })
    @JoinColumn({ name: "challenge_id" })
    challenge: VerificationChallengeRow

    @Column({ type: "int", name: "challenge_id" })
    challenge_id: number

    @Column({ type: "text" })
    result: string

    @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
    checked_at: Date

    @Column({ type: "text", nullable: true })
    dns_response?: string

    static fromDomain(attempt: VerificationAttempt): VerificationAttemptsRow {
        const row = new VerificationAttemptsRow()
        row.id = attempt.id
        row.challenge_id = attempt.challenge_id
        row.result = attempt.result
        row.checked_at = attempt.checked_at
        row.dns_response = attempt.dns_response

        return row
    }

    static toDomain(row: VerificationAttemptsRow): VerificationAttempt {
        return new VerificationAttempt(
            row.id,
            row.challenge_id,
            toVerificationAttemptStatus(row.result),
            row.checked_at,
            row.dns_response
        )
    }
}