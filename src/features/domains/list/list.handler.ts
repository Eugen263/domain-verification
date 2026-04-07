import { TYPES } from "@app/di/symbols";
import { DomainRepository } from "@app/domain/repository";
import { IDomainDTO, IPagedResponse, PagedRequest } from "@app/features/dto";
import { inject, injectable } from "inversify";
import { DomainDTO } from "./list.dto";

@injectable()
export class ListDomainsHandler {
    constructor(
        @inject(TYPES.DomainRepository) private readonly domainRepository: DomainRepository
    ) {}

    async execute(pages: PagedRequest): Promise<IPagedResponse<IDomainDTO>> {
        const { domains, total } = await this.domainRepository.list(pages.offsetValue, pages.limitValue)

        return {
            data: domains.map(DomainDTO.fromDomain),
            total,
            limit: pages.limitValue,
            page: pages.pageValue
        }
    }
}