import { inject, injectable } from "inversify"
import { Body, Post, Response, Route, SuccessResponse, Tags } from "@tsoa/runtime"

import { TYPES } from "@app/di/symbols"
import { RegisterDomainHandler } from "./register.handler"
import { RegisterDomainBody, IRegisterDomainResponse, RegisterDomainResponse } from "./register.dto"
import { IApiError } from "../../dto"
import { validate } from "@app/utils"

@injectable()
@Route("domains")
@Tags("Domains")
@Response<IApiError>(429, "Too many requests")
export class RegisterDomainController {
    constructor(
        @inject(TYPES.RegisterDomainHandler) private readonly registerDomain: RegisterDomainHandler,
    ) { }

    /**
     * Register a domain and receive a verification challenge.
     * Add the challenge as a DNS TXT record to prove ownership.
     */
    @Post()
    @SuccessResponse(201, "Domain registered")
    @Response<IApiError>(422, "Invalid domain name")
    async register(@Body() body: RegisterDomainBody): Promise<IRegisterDomainResponse> {
        await validate(RegisterDomainBody, body)

        const result = await this.registerDomain.execute(body.domain, body.owner)

        return RegisterDomainResponse.fromDomainWithChallenge(result)
    }
}
