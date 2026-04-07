import dns from "dns/promises";
import { inject } from "inversify";

import { TYPES } from "@app/di/symbols";
import { DomainRepository, VerificationAttemptsRepository, VerificationChallengeRepository } from "@app/domain/repository";

import { env } from "@app/env";
import { VerificationAttempt } from "@app/domain/entity";
import { WebhookHandler } from "@app/features/webhook/webhook.handler";
import { WebhookMessage } from "@app/features/webhook/webhook.dto";
import { DomainStatus } from "@app/domain/value_object";
import { logger } from "@app/utils";

dns.setDefaultResultOrder("ipv4first");
dns.setServers([env.DNS_SERVERS]);

export class DomainVerificationWorker {
    private intervalId: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;

    constructor(
        @inject(TYPES.WebhookHandler) private webhookHandler: WebhookHandler,
        @inject(TYPES.DomainRepository) private domainRepository: DomainRepository,
        @inject(TYPES.VerificationChallengeRepository) private challengeRepository: VerificationChallengeRepository,
        @inject(TYPES.VerificationAttemptsRepository) private attemptsRepository: VerificationAttemptsRepository
    ) { }

    start() {
        if (this.intervalId) {
            logger.warn("DomainVerificationWorker is already running.");
            return;
        }

        logger.info("Starting DomainVerificationWorker...");

        this.intervalId = setInterval(() => {
            if (this.isRunning) {
                return;
            }

            this.verifyDomains();
        }, 60 * 1000); // Run every minute
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.isRunning = false;
            logger.info("DomainVerificationWorker stopped.");
        }
    }

    private async verifyDomains() {
        this.isRunning = true;

        let count = await this.challengeRepository.getPendingChallengesCount();

        if (count == 0) {
            logger.info("DomainVerificationWorker: No pending challenges to verify.");
            this.isRunning = false;
            return;
        }

        logger.info(`DomainVerificationWorker: ${count} pending challenges to verify.`);

        try {
            for (let offset = 0; offset < count; offset += env.DOMAIN_VERIFICATION_WORKER_POOL_SIZE) {
                const pendingChallenges = await this.challengeRepository.findPendingChallenges({
                    limit: env.DOMAIN_VERIFICATION_WORKER_POOL_SIZE,
                    offset
                });

                await Promise.all(pendingChallenges.map(async (challenge) => {
                    let attempt = VerificationAttempt.create(challenge.id);

                    const domain = await this.domainRepository.findById(challenge.domain_id);
                    if (!domain) {
                        logger.warn(`DomainVerificationWorker: Domain with id ${challenge.domain_id} not found for challenge ${challenge.id}`);
                        await this.attemptsRepository.insert(attempt);
                        return;
                    }

                    if (challenge.isExpired()) {
                        challenge.markAsFailed();
                        domain.setStatus(DomainStatus.EXPIRED);

                        await this.attemptsRepository.insert(attempt);
                        await this.challengeRepository.save(challenge);
                        await this.domainRepository.save(domain);
                        return;
                    }

                    let records: string[][] = [];
                    try {
                        records = await dns.resolveTxt(domain.domain.toString());
                    } catch (error) {
                        logger.error(`DomainVerificationWorker: Error resolving TXT records for domain ${domain.domain.toString()}:`, { error });
                        attempt.addDnsResponse(`Error resolving TXT records: ${(error as Error).message}`);
                    }

                    let flattenedRecords = records.flat().map(record => record.trim());

                    // Check if the challenge string is present in the flattened records
                    if (flattenedRecords.includes(challenge.challenge)) {
                        challenge.markAsVerified();
                        attempt.markAsSuccess(JSON.stringify(records));
                    } else {
                        attempt.markAsRecordNotFound();
                    }

                    await this.challengeRepository.save(challenge);
                    await this.attemptsRepository.insert(attempt);

                    if (challenge.isVerified()) {
                        logger.info(`DomainVerificationWorker: Domain ${domain.domain.toString()} verified successfully for challenge ${challenge.id}`);

                        domain.setStatus(DomainStatus.VERIFIED);
                        await this.domainRepository.save(domain);

                        await this.webhookHandler.sendVerificationResult(WebhookMessage.fromDomain(domain));
                    }
                }));
            }
        } catch (error) {
            logger.error("DomainVerificationWorker: Error verifying domains:", { error });
        }

        // After processing all challenges, set isRunning to false to allow the next interval to run
        this.isRunning = false;
    }
}
