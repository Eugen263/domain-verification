import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

export const env = createEnv({
    server: {
        PORT: z.coerce.number().default(3000),
        HOST: z.string().default("127.0.0.1"),
        DB_HOST: z.string().default("localhost"),
        DB_PORT: z.coerce.number().default(5432),
        DB_USER: z.string(),
        DB_PASSWORD: z.string(),
        DB_NAME: z.string(),

        DOMAIN_VERIFICATION_TTL: z.coerce.number().default(3600),
        DOMAIN_VERIFICATION_WORKER_POOL_SIZE: z.coerce.number().default(50),
        DNS_SERVERS: z.string().default("1.1.1.1"),

        RATELIMIT_MAX: z.coerce.number().default(60),
        RATELIMIT_WINDOW_MS: z.coerce.number().default(60000),

        WEBHOOK_URL: z.string().url().optional(),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
});
