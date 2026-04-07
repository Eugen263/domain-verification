export class DomainName {
    // the domain name to be verified
    private readonly domain: string

    constructor(domain: string) {
        this.domain = domain
        if (!this.isValid()) {
            throw new Error(`Invalid domain name: ${domain}`)
        }
    }

    /**
     * Validates the domain name format using a regular expression.
     * This method checks if the domain name is in a valid format, which includes:
     * - It must contain at least one dot (.) to separate the labels and the top-level domain (TLD).
     * - Each label must consist of alphanumeric characters and hyphens (-), but cannot start or end with a hyphen.
     * - Subdomains are supported (e.g. sub.example.com).
     * - The TLD must be at least 2 characters long.
     * 
     * @returns A boolean indicating whether the domain name is valid or not.
     */
    isValid(): boolean {
        const domainRegex = /^([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/
        return domainRegex.test(this.domain)
    }

    /**
     * Returns the string representation of the DomainName object.
     * This method allows the DomainName object to be easily converted to a string, which can be useful for logging or displaying the domain name.
     * @returns The domain name as a string.
     */
    toString(): string {
        return this.domain
    }

    get value(): string {
        return this.domain
    }
}