import { Get, Path, Route, Tags, Response, SuccessResponse } from "@tsoa/runtime";
import { inject, injectable } from "inversify";

import { TYPES } from "@app/di/symbols";

import { GetDomainByIdResponse, IGetDomainByIdResponse } from "./get_by_id.dto";
import { GetDomainByIdHandler } from "./get_by_id.handler";
import { IApiError } from "../../dto";

@injectable()
@Route("domains")
@Tags("Domains")
@Response<IApiError>(429, "Too many requests")
export class GetDomainByIdController {

    constructor(
        @inject(TYPES.GetDomainByIdHandler) private getDomainByIdHandler: GetDomainByIdHandler
    ) { }

    // here we can reuse the same response DTO as the register endpoint since it contains all the necessary information about the domain and its challenge
    @Get("/{id}")
    @SuccessResponse(200, "Success")
    @Response<IApiError>(404, "Domain not found")
    async get_by_id(@Path() id: number): Promise<IGetDomainByIdResponse> {
        const result = await this.getDomainByIdHandler.execute(id)

        return GetDomainByIdResponse.fromDomainWithChallengeAndHistory(result)
    }
}