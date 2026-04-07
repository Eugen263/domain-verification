import { injectable } from "inversify"
import { QueryFailedError } from "typeorm"

import { AppDataSource } from "../../config/database"

import { Domain } from "../../domain/entity"
import { DomainRepository } from "../../domain/repository"
import { DomainRow } from "../db"
import { ApiError, ErrorCode } from "../../error"

@injectable()
export class DomainRepositoryImpl extends DomainRepository {
    private readonly repo = AppDataSource.getRepository(DomainRow)

    async findById(id: number): Promise<Domain | null> {
        const entity = await this.repo.findOne({ where: { id } })
        return entity ? entity.toDomain() : null
    }

    async getDomainById(id: number): Promise<string | null> {
        const entity = await this.repo.findOne({ where: { id }, select: ["domain"] })
        return entity ? entity.domain : null
    }

    async insert(domain: Domain): Promise<Domain> {
        try {
            const entity = DomainRow.fromDomain(domain)
            const saved = await this.repo.insert(entity)
            entity.id = saved.identifiers[0].id
            return entity.toDomain()
        } catch (err) {
            if (err instanceof QueryFailedError && (err as any).driverError?.code === "23505") {
                throw new ApiError(ErrorCode.Conflict, "Domain already registered")
            }
            throw err
        }
    }

    async save(domain: Domain): Promise<Domain> {
        const entity = DomainRow.fromDomain(domain)
        const saved = await this.repo.save(entity)
        return saved.toDomain()
    }

    async markAsVerified(domainId: number): Promise<void> {
        await this.repo.update({ id: domainId }, { status: "verified" })
    }

    async list(offset: number, limit: number): Promise<{ domains: Domain[], total: number }> {
        const [entities, total] = await this.repo.findAndCount({ skip: offset, take: limit })
        const domains = entities.map(e => e.toDomain())
        return { domains, total }
    }
}
