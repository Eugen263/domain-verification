import { DataSource } from "typeorm"
import { env } from "../env"
import { DomainRow, VerificationAttemptsRow, VerificationChallengeRow } from "../infrastructure/db"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    synchronize: false,
    logging: false,
    entities: [DomainRow, VerificationAttemptsRow, VerificationChallengeRow],
    migrations: ["migrations/*.ts"],
})
