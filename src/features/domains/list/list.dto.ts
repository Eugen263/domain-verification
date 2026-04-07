import { Domain } from "../../../domain/entity";
import { IDomainDTO } from "../../dto";

export class DomainDTO {
    static fromDomain(domain: Domain): IDomainDTO {
        return {
            id: domain.id,
            domain: domain.domain.toString(),
            owner_id: domain.owner_id,
            status: domain.status,
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt
        }
    }
}