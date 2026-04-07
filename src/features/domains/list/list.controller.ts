import { Get, Query, Route, SuccessResponse, Tags, Response } from "@tsoa/runtime";
import { inject, injectable } from "inversify";

import { TYPES } from "@app/di/symbols";
import { ListDomainsHandler } from "./list.handler";
import { IApiError, IDomainDTO, IPagedResponse, PagedRequest } from "../../dto";

@injectable()
@Route("domains")
@Tags("Domains")
@Response<IApiError>(429, "Too many requests")
export class ListDomainsController {
    constructor(
        @inject(TYPES.ListDomainsHandler) private readonly listDomainsHandler: ListDomainsHandler
    ) {}


    @Get()
    @SuccessResponse(200, "List of domains")
    @Response(500, "Internal server error")
    async list(@Query("page") page?: number, @Query("limit") limit?: number): Promise<IPagedResponse<IDomainDTO>> {
        const query_payload = new PagedRequest(page, limit)

        const result = await this.listDomainsHandler.execute(query_payload)

        return result
    }
}