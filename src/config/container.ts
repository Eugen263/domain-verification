import { Container } from "inversify"

import { TYPES } from "@app/di/symbols"

import { DomainRepository, VerificationAttemptsRepository, VerificationChallengeRepository } from "@app/domain/repository"

import { DomainRepositoryImpl, VerificationChallengeRepositoryImpl } from "@app/infrastructure/repository"

import { RegisterDomainHandler } from "@app/features/domains/register/register.handler"
import { RegisterDomainController } from "@app/features/domains/register/register.controller"
import { GetDomainByIdHandler } from "@app/features/domains/get_by_id/get_by_id.handler"
import { GetDomainByIdController } from "@app/features/domains/get_by_id/get_by_id.controller"
import { VerificationAttemptsRepositoryImpl } from "@app/infrastructure/repository/verification_attempts_repository_impl"
import { ListDomainsHandler } from "@app/features/domains/list/list.handler"
import { ListDomainsController } from "@app/features/domains/list/list.controller"
import { ReverifyDomainHandler } from "@app/features/domains/reverify/reverify.handler"
import { ReverifyDomainController } from "@app/features/domains/reverify/reverivy.controller"
import { WebhookHandler } from "@app/features/webhook/webhook.handler"

const container = new Container()

container.bind<DomainRepository>(TYPES.DomainRepository).to(DomainRepositoryImpl)
container.bind<VerificationChallengeRepository>(TYPES.VerificationChallengeRepository).to(VerificationChallengeRepositoryImpl)
container.bind<VerificationAttemptsRepository>(TYPES.VerificationAttemptsRepository).to(VerificationAttemptsRepositoryImpl)

container.bind<GetDomainByIdHandler>(TYPES.GetDomainByIdHandler).to(GetDomainByIdHandler)
container.bind<RegisterDomainHandler>(TYPES.RegisterDomainHandler).to(RegisterDomainHandler)
container.bind<ListDomainsHandler>(TYPES.ListDomainsHandler).to(ListDomainsHandler)
container.bind<ReverifyDomainHandler>(TYPES.ReverifyDomainHandler).to(ReverifyDomainHandler)

container.bind<GetDomainByIdController>(GetDomainByIdController).to(GetDomainByIdController)
container.bind<RegisterDomainController>(RegisterDomainController).to(RegisterDomainController)
container.bind<ListDomainsController>(ListDomainsController).to(ListDomainsController)
container.bind<ReverifyDomainController>(ReverifyDomainController).to(ReverifyDomainController)

container.bind<WebhookHandler>(TYPES.WebhookHandler).to(WebhookHandler)

export { container }
