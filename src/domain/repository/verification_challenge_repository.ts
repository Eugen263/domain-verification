import { injectable } from "inversify"
import { VerificationChallenge } from "../entity";

@injectable()
export abstract class VerificationChallengeRepository {
    /**
     * Find the verification challenge associated with a specific domain ID.
     * This is useful for retrieving the current challenge when a user wants to verify their domain ownership.
     * 
     * @param domainId The ID of the domain for which to find the verification challenge
     * @returns A promise that resolves to the verification challenge or null if not found
     */
    abstract findChallengeByDomainId(domainId: number): Promise<VerificationChallenge | null>

    /**
     * Get the count of pending verification challenges.
     * This can be used for monitoring purposes to see how many domains are currently in the process of being verified.
     */
    abstract getPendingChallengesCount(): Promise<number>

    /**
     * Find pending verification challenges with pagination.
     * This is useful for processing or displaying a subset of pending challenges.
     * 
     * @param params The pagination parameters
     * @param params.limit The maximum number of challenges to return
     * @param params.offset The number of challenges to skip
     * @returns A promise that resolves to an array of pending verification challenges
     */
    abstract findPendingChallenges({ limit, offset }: { limit: number; offset: number }): Promise<VerificationChallenge[]>

    /**
     * Insert a new verification challenge into the repository.
     * This is typically used when a new domain is registered and a challenge needs to be created for it.
     * 
     * @param challenge The verification challenge to insert
     * @returns A promise that resolves to the inserted verification challenge
     */
    abstract insert(challenge: VerificationChallenge): Promise<VerificationChallenge>

    /**
     * Save an existing verification challenge.
     * 
     * @param challenge The verification challenge to save
     * @returns A promise that resolves to the saved verification challenge
     */
    abstract save(challenge: VerificationChallenge): Promise<VerificationChallenge>
}