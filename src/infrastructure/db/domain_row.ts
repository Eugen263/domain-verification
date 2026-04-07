import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { Domain } from "../../domain/entity"
import { DomainName, toDomainStatus } from "../../domain/value_object"

@Entity("domains")
export class DomainRow {
    @PrimaryGeneratedColumn()
    id: number

    @Index("idx_domains_domain")
    @Column({ type: "text", unique: true })
    domain: string

    @Index("idx_domains_owner")
    @Column({ type: "int" })
    owner_id: number

    @Index("idx_domains_status")
    @Column({ type: "text" })
    status: string

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt: Date

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt: Date

    /**
     * Convert this entity to a domain object.
     * 
     * @returns 
     */
    public toDomain(): Domain {
        return new Domain(
            this.id,
            new DomainName(this.domain),
            this.owner_id,
            toDomainStatus(this.status),
            this.createdAt,
            this.updatedAt
        )
    }

    /**
     * Create a new entity from a domain object.
     * 
     * @param domain The domain object to convert.
     * @returns 
     */
    public static fromDomain(domain: Domain): DomainRow {
        const entity = new DomainRow()
        entity.id = domain.id
        entity.domain = domain.domain.value
        entity.owner_id = domain.owner_id
        entity.status = domain.status
        entity.createdAt = domain.createdAt
        entity.updatedAt = domain.updatedAt
        return entity
    }
}