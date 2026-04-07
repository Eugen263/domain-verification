import { injectable } from "inversify";
import { WebhookMessage } from "./webhook.dto";
import { env } from "@app/env";
import { logger } from "@app/utils";

@injectable()
export class WebhookHandler {
    async sendVerificationResult(domain: WebhookMessage) {
        if (!env.WEBHOOK_URL) {
            return;
        }

        try {
            const req = await fetch(env.WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(domain.toJSON()),
            });

            if (!req.ok) {
                logger.error(`WebhookHandler: Failed to send webhook for domain ${domain.domain}. Status: ${req.status}, Response: ${await req.text()}`);
            }
        } catch (error) {
            logger.error(`WebhookHandler: Error sending webhook for domain ${domain.domain}:`, { error });
        }
    }
}