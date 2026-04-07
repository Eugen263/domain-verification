import { container } from "./container"

export function iocContainer(_request: unknown) {
    return {
        get<T>(constructor: new (...args: never[]) => T): T {
            // @ts-expect-error - This is a simple wrapper around the InversifyJS container to provide a consistent interface for dependency injection.
            return container.get<T>(constructor)
        }
    }
}
