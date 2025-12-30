import * as z3 from 'zod/v3';
import { $ZodType } from 'zod/v4/core';

interface UnknownSchema {
    parse(input: unknown): unknown;
    array?: () => UnknownSchema;
}

interface ZodDto<TSchema extends UnknownSchema> {
    new (): ReturnType<TSchema['parse']>;
    isZodDto: true;
    schema: TSchema;
    create(input: unknown): ReturnType<TSchema['parse']>;
    Output: ZodDto<UnknownSchema>;
    _OPENAPI_METADATA_FACTORY(): unknown;
}
declare function createZodDto<TSchema extends UnknownSchema | z3.ZodTypeAny | ($ZodType & {
    parse: (input: unknown) => unknown;
})>(schema: TSchema): ZodDto<TSchema> & {
    io: "input";
};
declare function isZodDto(metatype: unknown): metatype is ZodDto<UnknownSchema>;

export { ZodDto, createZodDto, isZodDto };
