export enum DomainStatus {
    PENDING = "pending",
    VERIFIED = "verified",
    EXPIRED = "expired",
}

export type TDomainStatus = typeof DomainStatus[keyof typeof DomainStatus]

export function toDomainStatus(status: string): DomainStatus {
    switch (status) {
        case "pending":
            return DomainStatus.PENDING
        case "verified":
            return DomainStatus.VERIFIED
        case "expired":
            return DomainStatus.EXPIRED
        default:
            throw new Error(`Invalid domain status: ${status}`)
    }
}