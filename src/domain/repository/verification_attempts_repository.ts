import { injectable } from "inversify";
import { VerificationAttempt } from "../entity";

@injectable()
export abstract class VerificationAttemptsRepository {
    abstract insert(attempt: VerificationAttempt): Promise<void>;

    abstract save(attempt: VerificationAttempt): Promise<void>;

    abstract getVerificationHistoryByChallengeId(challengeId: number): Promise<VerificationAttempt[]>;
}