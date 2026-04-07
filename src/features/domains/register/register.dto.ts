import { Contains, Length, IsInt } from "class-validator"
import { DomainWithChallenge } from "../../../domain/queries"
import { TDomainStatus } from "../../../domain/value_object"
import { IDomainDTO, IChallengeDTO } from "../../dto"

export class RegisterDomainBody {
    /** The domain name to verify */
    @Length(1, 255, { message: "Domain must be between 1 and 255 characters" })
    @Contains(".", { message: "Domain must contain a dot" })
    domain: string
    /** ID of the owner */
    @IsInt({ message: "Owner must be an integer" })
    owner: number
}

export interface IRegisterDomainResponse extends IDomainDTO {
    challenge: IChallengeDTO
}

export class RegisterDomainResponse implements IRegisterDomainResponse {
    constructor(
        public id: number,
        public domain: string,
        public owner_id: number,
        public status: TDomainStatus,
        public createdAt: Date,
        public updatedAt: Date,
        public challenge: IChallengeDTO
    ) {}

    static fromDomainWithChallenge(data: DomainWithChallenge): IRegisterDomainResponse {
        return {
            id: data.id,
            domain: data.domain.toString(),
            owner_id: data.owner_id,
            status: data.status,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            challenge: {
                id: data.challenge.id,
                challenge: data.challenge.challenge,
                status: data.challenge.status,
                expiresAt: data.challenge.expires_at,
                createdAt: data.challenge.created_at,
                updatedAt: data.challenge.updated_at
            }
        }
    }
}