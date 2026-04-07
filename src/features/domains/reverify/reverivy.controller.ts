import { Path, Post, Response, Route, Tags } from "@tsoa/runtime";
import { inject, injectable } from "inversify";
import { ReverifyDomainHandler } from "./reverify.handler";
import { TYPES } from "@app/di/symbols";
import { IApiError } from "../../dto";
import { IRegisterDomainResponse, RegisterDomainResponse } from "../register/register.dto";

@injectable()
@Tags("Domains")
@Route("domains")
@Response<IApiError>(429, "Too many requests")
export class ReverifyDomainController {

    constructor(
        @inject(TYPES.ReverifyDomainHandler) private readonly reverifyDomainHandler: ReverifyDomainHandler
    ) {}

    @Post("{id}/reverify")
    async reverifyDomain(@Path("id") id: number): Promise<IRegisterDomainResponse> {
        const result = await this.reverifyDomainHandler.execute(id);

        return RegisterDomainResponse.fromDomainWithChallenge(result)
    }
}