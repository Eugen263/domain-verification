import { describe, it, expect } from "@jest/globals"
import { IsInt, Length, Contains, ValidateNested } from "class-validator"
import { Type } from "class-transformer"
import { validate } from "@app/utils/validate"
import { ValidateError } from "@tsoa/runtime"

class SampleBody {
    @Length(1, 10, { message: "name must be 1-10 chars" })
    @Contains("x", { message: "name must contain x" })
    name: string

    @IsInt({ message: "count must be an integer" })
    count: number
}

class InnerBody {
    @IsInt({ message: "value must be an integer" })
    value: number
}

class OuterBody {
    @ValidateNested()
    @Type(() => InnerBody)
    inner: InnerBody
}

describe("validate", () => {
    // ── happy path ────────────────────────────────────────────────────────────

    it("resolves without throwing for a valid object", async () => {
        await expect(validate(SampleBody, { name: "xylo", count: 3 })).resolves.toBeUndefined()
    })

    // ── single field violation ────────────────────────────────────────────────

    it("throws ValidateError when a single constraint fails", async () => {
        await expect(validate(SampleBody, { name: "xylo", count: 1.5 })).rejects.toThrow(ValidateError)
    })

    it("includes the failing field name in the error", async () => {
        await expect(validate(SampleBody, { name: "xylo", count: 1.5 }))
            .rejects.toMatchObject({ fields: expect.objectContaining({ count: expect.any(Object) }) })
    })

    it("puts the constraint message in the field error", async () => {
        await expect(validate(SampleBody, { name: "xylo", count: 1.5 }))
            .rejects.toMatchObject({ fields: { count: { message: "count must be an integer" } } })
    })

    // ── multiple field violations ─────────────────────────────────────────────

    it("reports all failing fields when multiple constraints fail", async () => {
        const err: ValidateError = await validate(SampleBody, { name: "toolongname!", count: 1.5 }).catch(e => e)

        expect(err).toBeInstanceOf(ValidateError)
        expect(err.fields).toHaveProperty("name")
        expect(err.fields).toHaveProperty("count")
    })

    // ── missing fields ────────────────────────────────────────────────────────

    it("throws ValidateError when a required field is missing", async () => {
        await expect(validate(SampleBody, { name: "xylo" })).rejects.toThrow(ValidateError)
    })

    it("throws ValidateError when the object is empty", async () => {
        await expect(validate(SampleBody, {})).rejects.toThrow(ValidateError)
    })

    // ── multiple constraint messages joined ───────────────────────────────────

    it("joins multiple constraint messages for the same field with a comma", async () => {
        // "" fails @Length(1, 10) AND @Contains("x") simultaneously
        const err: ValidateError = await validate(SampleBody, { name: "", count: 5 }).catch(e => e)

        expect(err).toBeInstanceOf(ValidateError)
        expect(err.fields.name.message).toContain("name must be 1-10 chars")
        expect(err.fields.name.message).toContain("name must contain x")
    })

    // ── nested validation (constraints may be absent on the parent error) ──────

    it("throws ValidateError for nested object validation failures", async () => {
        await expect(validate(OuterBody, { inner: { value: 1.5 } })).rejects.toThrow(ValidateError)
    })

    it("includes the parent field in the error for nested failures", async () => {
        const err: ValidateError = await validate(OuterBody, { inner: { value: 1.5 } }).catch(e => e)

        expect(err).toBeInstanceOf(ValidateError)
        expect(err.fields).toHaveProperty("inner")
    })
})
