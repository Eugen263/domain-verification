import { DomainWithChallengeAndHistory } from "../../../domain/queries";
import { TDomainStatus } from "../../../domain/value_object";
import { IChallengeDTO, IDomainDTO, IVerificationAttemptDTO } from "../../dto";

export interface IGetDomainByIdResponse extends IDomainDTO {
    challenge: IChallengeDTO,
    verification_history: IVerificationAttemptDTO[]
}

export class GetDomainByIdResponse implements IGetDomainByIdResponse {
    constructor(
        public id: number,
        public domain: string,
        public owner_id: number,
        public status: TDomainStatus,
        public createdAt: Date,
        public updatedAt: Date,
        public challenge: IChallengeDTO,
        public verification_history: IVerificationAttemptDTO[]
    ) {}

    static fromDomainWithChallengeAndHistory(data: DomainWithChallengeAndHistory): IGetDomainByIdResponse {
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
            },
            verification_history: data.verification_history.map(attempt => ({
                id: attempt.id,
                result: attempt.result,
                checkedAt: attempt.checked_at
            }))
        }
    }
}