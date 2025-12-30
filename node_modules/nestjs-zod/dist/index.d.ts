import * as z3 from 'zod/v3';
import { z } from 'zod/v3';
import { $ZodType, input } from 'zod/v4/core';
import * as _nestjs_common from '@nestjs/common';
import { BadRequestException, InternalServerErrorException, CanActivate, PipeTransform, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { Observable } from 'rxjs';
import { OpenAPIObject } from '@nestjs/swagger';

interface UnknownSchema {
    parse(input: unknown): unknown;
    array?: () => UnknownSchema;
}
/**
 * RequiredBy
 * @desc From `T` make a set of properties by key `K` become required
 * @example
 *    type Props = {
 *      name?: string;
 *      age?: number;
 *      visible?: boolean;
 *    };
 *
 *    // Expect: { name: string; age: number; visible: boolean; }
 *    type Props = RequiredBy<Props>;
 *
 *    // Expect: { name?: string; age: number; visible: boolean; }
 *    type Props = RequiredBy<Props, 'age' | 'visible'>;
 */
type RequiredBy<T extends object, K extends keyof T = keyof T> = Omit<T, K> & Required<Pick<T, K>>;

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

declare class ZodValidationException extends BadRequestException {
    private error;
    constructor(error: unknown);
    getZodError(): unknown;
}
declare class ZodSerializationException extends InternalServerErrorException {
    private error;
    constructor(error: unknown);
    getZodError(): unknown;
}
type ZodExceptionCreator = (error: unknown) => Error;

type Source = 'body' | 'query' | 'params';
interface ZodBodyGuardOptions {
    createValidationException?: ZodExceptionCreator;
}
type ZodGuardClass = new (source: Source, schemaOrDto: UnknownSchema | ZodDto<UnknownSchema>) => CanActivate;
/**
 * @deprecated `createZodGuard` will be removed in a future version, since
 * guards are not intended for validation purposes.
 */
declare function createZodGuard({ createValidationException, }?: ZodBodyGuardOptions): ZodGuardClass;
/**
 * @deprecated `ZodGuard` will be removed in a future version, since guards
 * are not intended for validation purposes.
 */
declare const ZodGuard: ZodGuardClass;
/**
 * @deprecated `UseZodGuard` will be removed in a future version, since guards
 * are not intended for validation purposes.
 */
declare const UseZodGuard: (source: Source, schemaOrDto: UnknownSchema | ZodDto<UnknownSchema>) => MethodDecorator & ClassDecorator;

interface ExtendedSchemaObject extends SchemaObject {
    [key: `x-${string}`]: any;
}
/**
 * @deprecated `zodToOpenAPI` will be removed in a future version, since zod
 * v4 adds built-in support for generating OpenAPI schemas from zod schemas.
 */
declare function zodV3ToOpenAPI(zodType: z.ZodTypeAny, visited?: Set<any>): ExtendedSchemaObject;

interface ZodValidationPipeOptions {
    createValidationException?: ZodExceptionCreator;
}
type ZodValidationPipeClass = new (schemaOrDto?: UnknownSchema | ZodDto<UnknownSchema>) => PipeTransform;
declare function createZodValidationPipe({ createValidationException, }?: ZodValidationPipeOptions): ZodValidationPipeClass;
declare const ZodValidationPipe: ZodValidationPipeClass;

declare function ZodSerializerDto(dto: ZodDto<UnknownSchema> | UnknownSchema | [ZodDto<UnknownSchema>] | [UnknownSchema]): _nestjs_common.CustomDecorator<"ZOD_SERIALIZER_DTO_OPTIONS">;
declare class ZodSerializerInterceptor implements NestInterceptor {
    protected readonly reflector: any;
    constructor(reflector: any);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    protected getContextResponseSchema(context: ExecutionContext): ZodDto<UnknownSchema> | UnknownSchema | [ZodDto<UnknownSchema>] | [UnknownSchema] | undefined;
}

/**
 * @deprecated `validate` will be removed in a future version.  It is
 * recommended to use `.parse` directly
 */
declare function validate<TSchema extends UnknownSchema>(value: unknown, schemaOrDto: TSchema | ZodDto<TSchema>, createValidationException?: ZodExceptionCreator): ReturnType<TSchema['parse']>;

/**
 * This function performs some post-processing on the OpenAPI document.  It
 * should only touch parts of the document that were generated from nestjs-zod
 * DTOs.
 *
 * Specifically, this function:
 * 1. Removes empty `type` fields
 * 2. Renames OpenAPI schemas that have an explicit `id` field to match that
 *    `id`, instead of using the DTO class name
 * 3. If the DTO's schema references another zod schema, it adds that zod
 *    schema's OpenAPI representation to `components.schemas`
 * 4. If a DTO is created directly with an array zod schema, it ensures the
 *    OpenAPI schema is generated properly
 * 5. Handles recursive zod schemas
 * 6. Handles `null` properly based on the OpenAPI version
 *
 * @param doc - The OpenAPI document that is generated by `SwaggerModule.createDocument`
 * @param options.version - The version of OpenAPI to use.  Defaults to `auto`,
 * which will use the version of the OpenAPI object passed in.  Note if the
 * version is `3.1` then it impacts how `null` is handled.  In `3.0`, `nullable:
 * true` is used, while in `3.1` `anyOf: [..., { type: 'null' }]` is used
 * instead
 * @returns A cleaned up OpenAPI document
 */
declare function cleanupOpenApiDoc(doc: OpenAPIObject, { version: versionParam }?: {
    version?: '3.1' | '3.0' | 'auto';
}): OpenAPIObject;

/**
 * `@ZodResponse` can be used to set the response information for a method.
 * This is the recommended way to handle responses, since it applies a few
 * related decorators at once to keep them in sync:
 *
 * 1. Uses `@ZodSerializerDto` to serialize the return value of the method.  This
 *    means the return value of the method will be parsed by the DTO's schema.
 * 2. Uses `@ApiResponse` to set the response DTO for the method.  This means
 *    the OpenAPI documentation will be updated to reflect the DTO's schema.
 *    Note that ZodResponse automatically uses the output version of the DTO, so
 *    there is no need to use DTO.Output.
 * 3. Uses `@HttpCode` to set the HTTP status code for the response if `status`
 *    is provided
 * 4. Lastly, it also throws a typescript error if the return value of the
 *    method does not match the DTO's input schema.
 *
 * `@ZodResponse` is powerful because it keeps the run-time, compile-time, and
 * docs-time response representations in sync
 *
 *
 * @example
 * ```ts
 * @Get()
 * @ZodResponse({ status: 200, description: 'Get book', type: BookDto })
 * getBook() {
 *   return { id: '1' };
 * }
 * ```
 *
 * @example
 * ```ts
 * @Get()
 * @ZodResponse({ status: 200, description: 'Get books', type: [BookDto] })
 * getBooks() {
 *   return [{ id: '1' }, { id: '2' }];
 * }
 */
declare function ZodResponse<TSchema extends UnknownSchema>({ status, description, type }: {
    status?: number;
    description?: string;
    type: ZodDto<TSchema> & {
        io: "input";
    };
}): (target: object, propertyKey?: string | symbol, descriptor?: Pick<TypedPropertyDescriptor<(...args: any[]) => input<TSchema> | Promise<input<TSchema>>>, 'value'>) => void;
declare function ZodResponse<TSchema extends RequiredBy<UnknownSchema, 'array'>>({ status, description, type }: {
    status?: number;
    description?: string;
    type: [ZodDto<TSchema> & {
        io: "input";
    }];
}): (target: object, propertyKey?: string | symbol, descriptor?: Pick<TypedPropertyDescriptor<(...args: any[]) => Array<input<TSchema>> | Promise<Array<input<TSchema>>>>, 'value'>) => void;

export { UseZodGuard, ZodDto, ZodGuard, ZodResponse, ZodSerializationException, ZodSerializerDto, ZodSerializerInterceptor, ZodValidationException, ZodValidationPipe, cleanupOpenApiDoc, createZodDto, createZodGuard, createZodValidationPipe, validate, zodV3ToOpenAPI };
