import "reflect-metadata"

import express from "express"
import swaggerUi from "swagger-ui-express"
import rateLimit from "express-rate-limit"

import { AppDataSource } from "./config/database"
import { container } from "./config/container"
import { TYPES } from "./di/symbols"

import { RegisterRoutes } from "./generated/routes"
import swaggerDocument from "./generated/swagger.json" with { type: "json" }

import { apiErrorMiddleware, notFoundErrorMiddleware } from "./middleware"
import { DomainVerificationWorker } from "./worker/domain_verification.worker"

import { env } from "./env"
import { ApiError, ErrorCode } from "./error"
import { logger } from "./utils"

const app = express()
app.use(express.json())

// Swagger UI
app.use("/docs", ...swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.use(rateLimit({
    windowMs: env.RATELIMIT_WINDOW_MS,
    limit: env.RATELIMIT_MAX,
    standardHeaders: "draft-8",
    message: { status: "error", data: "Too many requests, please try again later." }
}))

// tsoa-generated routes
RegisterRoutes(app)

app.use(notFoundErrorMiddleware)
app.use(apiErrorMiddleware)

const worker = new DomainVerificationWorker(
    // Inject the required repositories here
    container.get(TYPES.WebhookHandler),
    container.get(TYPES.DomainRepository),
    container.get(TYPES.VerificationChallengeRepository),
    container.get(TYPES.VerificationAttemptsRepository)
)

AppDataSource.initialize()
    .then(() => {
        app.listen(env.PORT, env.HOST, () => {
            logger.info(`Server is running at http://${env.HOST}:${env.PORT}`)
            logger.info(`Swagger UI at http://${env.HOST}:${env.PORT}/docs`)
        })

        // Start the domain verification worker
        worker.start()
    })
    .catch((err) => {
        logger.error("Failed to connect to database:", { error: err })
        process.exit(1)
    })
