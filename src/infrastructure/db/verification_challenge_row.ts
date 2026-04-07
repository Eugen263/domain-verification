import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm"

import { DomainRow } from "./domain_row"
import { VerificationChallenge } from "@app/domain/entity"

@Entity("verification_challenges")
export class VerificationChallengeRow {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => DomainRow, { onDelete: "CASCADE" })
    @JoinColumn({ name: "domain_id" })
    domain: DomainRow

    @Index("idx_challenges_domain_id")
    @Column({ type: "int", name: "domain_id" })
    domain_id: number

    @Column({ type: "text" })
    challenge: string

    @Column({ type: "text" })
    @Index("idx_challenges_status")
    status: string

    @Column({ type: "timestamptz", })
    expires_at: Date

    @CreateDateColumn({ type: "timestamptz", name: "created_at", default: () => "CURRENT_TIMESTAMP" })
    created_at: Date

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at", default: () => "CURRENT_TIMESTAMP" })
    updated_at: Date

    public toDomain(): VerificationChallenge {
        return new VerificationChallenge(
            this.id,
            this.domain_id,
            this.challenge,
            this.status as any,
            this.expires_at,
            this.created_at,
            this.updated_at
        )
    }

    public static fromDomain(challenge: VerificationChallenge): VerificationChallengeRow {
        const row = new VerificationChallengeRow()
        row.id = challenge.id
        row.domain_id = challenge.domain_id
        row.challenge = challenge.challenge
        row.status = challenge.status
        row.expires_at = challenge.expires_at
        row.created_at = challenge.created_at
        row.updated_at = challenge.updated_at
        return row
    }
}