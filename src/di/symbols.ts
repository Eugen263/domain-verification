export const TYPES = {
    DomainRepository: Symbol.for("DomainRepository"),
    VerificationChallengeRepository: Symbol.for("VerificationChallengeRepository"),
    VerificationAttemptsRepository: Symbol.for("VerificationAttemptsRepository"),
    
    GetDomainByIdHandler: Symbol.for("GetDomainByIdHandler"),
    RegisterDomainHandler: Symbol.for("RegisterDomainHandler"),
    ListDomainsHandler: Symbol.for("ListDomainsHandler"),
    ReverifyDomainHandler: Symbol.for("ReverifyDomainHandler"),

    WebhookHandler: Symbol.for("WebhookHandler"),
}
