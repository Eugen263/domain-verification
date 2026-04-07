import { injectable } from "inversify"
import { Domain } from "../entity/domain"

@injectable()
export abstract class DomainRepository {
    /**
     * Find a domain by its ID. Returns null if not found.
     * 
     * @param id The ID of the domain to find
     * @returns A promise that resolves to the found domain or null if not found
     */
    abstract findById(id: number): Promise<Domain | null>

    /**
     * Find a domain by its internal ID. Returns null if not found.
     * 
     * @param id The internal ID of the domain to find
     * @returns A promise that resolves to the found domain's internal ID or null if not found
     */
    abstract getDomainById(id: number): Promise<string | null>

    /**
     * Insert a new domain into the repository.
     * Returns the inserted domain with its ID populated.
     * 
     * @param domain The domain to insert
     * @returns A promise that resolves to the inserted domain with its ID populated
     */
    abstract insert(domain: Domain): Promise<Domain>

    /**
     * Save a domain to the repository.
     * 
     * @param domain The domain to save
     * @returns A promise that resolves to the saved domain
     */
    abstract save(domain: Domain): Promise<Domain>

    /**
     * Mark a domain as verified in the repository.
     * 
     * @param domainId The ID of the domain to mark as verified
     * @returns A promise that resolves when the operation is complete
     */
    abstract markAsVerified(domainId: number): Promise<void>

    abstract list(offset: number, limit: number): Promise<{ domains: Domain[], total: number }>
}
