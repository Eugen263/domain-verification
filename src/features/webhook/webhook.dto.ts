import { Domain } from "@app/domain/entity";
import { TDomainStatus } from "@app/domain/value_object";

interface IWebhookMessage {
    id: number,
    domain: string,
    owner_id: number,
    status: string,
}

export class WebhookMessage implements IWebhookMessage {
    id: number
    domain: string
    owner_id: number
    status: string

    constructor(id: number, domain: string, owner_id: number, status: TDomainStatus) {
        this.id = id
        this.domain = domain
        this.owner_id = owner_id
        this.status = status
    }

    static fromDomain(domain: Domain): WebhookMessage {
        return new WebhookMessage(
            domain.id,
            domain.domain.toString(),
            domain.owner_id,
            domain.status
        )
    }

    toJSON(): IWebhookMessage {
        return {
            id: this.id,
            domain: this.domain,
            owner_id: this.owner_id,
            status: this.status,
        }
    }
}