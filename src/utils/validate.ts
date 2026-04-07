import { ValidateError } from "@tsoa/runtime"
import { validate as classValidatorValidate, ValidationOptions } from "class-validator"
import { plainToInstance } from "class-transformer"

export const validate = async <T extends object>(
    cls: new () => T,
    plain: object,
    options?: ValidationOptions
): Promise<void> => {
    const instance = plainToInstance(cls, plain)
    const errors = await classValidatorValidate(instance, options)
    if (errors.length > 0) {
        const fieldErrors: { [key: string]: { message: string } } = {}
        errors.forEach(error => {
            const messages = Object.values(error.constraints || {})
            fieldErrors[error.property] = { message: messages.join(", ") }
        })
        throw new ValidateError(fieldErrors, "Validation failed")
    }
}