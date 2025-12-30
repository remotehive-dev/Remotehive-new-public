'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var core = require('zod/v4/core');
var deepmerge = require('deepmerge');
var v3 = require('zod/v3');
var common = require('@nestjs/common');
var rxjs = require('rxjs');
var node_util = require('node:util');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var deepmerge__default = /*#__PURE__*/_interopDefaultLegacy(deepmerge);

function assert(condition, message = "Assertion failed") {
  if (!condition) {
    throw new Error(`[nestjs-zod] ${message}`);
  }
}

const PREFIX = "x-nestjs_zod";
const EMPTY_TYPE_KEY = `${PREFIX}-empty-type`;
const DEFS_KEY = `${PREFIX}-$defs`;
const PARENT_ID_KEY = `${PREFIX}-parent-id`;
const PARENT_ADDITIONAL_PROPERTIES_KEY = `${PREFIX}-parent-additional-properties`;
const PARENT_HAS_REFS_KEY = `${PREFIX}-parent-has-refs`;
const UNWRAP_ROOT_KEY = `${PREFIX}-unwrap-root`;
const HAS_NULL_KEY = `${PREFIX}-has-null`;

var __defProp$5 = Object.defineProperty;
var __defProps$2 = Object.defineProperties;
var __getOwnPropDescs$2 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$2 = Object.getOwnPropertySymbols;
var __hasOwnProp$2 = Object.prototype.hasOwnProperty;
var __propIsEnum$2 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$5(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$2 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$2.call(b, prop))
      __defNormalProp$2(a, prop, b[prop]);
  if (__getOwnPropSymbols$2)
    for (var prop of __getOwnPropSymbols$2(b)) {
      if (__propIsEnum$2.call(b, prop))
        __defNormalProp$2(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$2 = (a, b) => __defProps$2(a, __getOwnPropDescs$2(b));
function fixAllRefs({ schema, defRenames, rootSchemaName }) {
  return walkJsonSchema(schema, (s) => {
    if (s.$ref) {
      if (s.$ref.startsWith("#/$defs/")) {
        const oldDefName = s.$ref.replace("#/$defs/", "");
        const newDefName = defRenames == null ? void 0 : defRenames[oldDefName];
        if (newDefName) {
          s.$ref = `#/$defs/${newDefName}`;
        }
      }
      s.$ref = s.$ref.replace("#/$defs/", "#/components/schemas/");
      if (s.$ref === "#") {
        if (!rootSchemaName) {
          throw new Error("[fixAllRefs] rootSchemaName is required when fixing a ref to #");
        }
        s.$ref = `#/components/schemas/${rootSchemaName}`;
      }
    }
    return s;
  }, {
    clone: true
  });
}
function fixNull(schema) {
  return walkJsonSchema(schema, (s) => {
    if (Object.keys(s).length === 1 && s.anyOf) {
      const nullSchema = s.anyOf.findIndex((subSchema) => subSchema.type === "null");
      if (nullSchema === -1) {
        return s;
      }
      s.anyOf.splice(nullSchema, 1);
      if (s.anyOf.length === 1) {
        return __spreadProps$2(__spreadValues$2({}, s.anyOf[0]), {
          nullable: true
        });
      }
      return {
        anyOf: s.anyOf.map((subSchema) => __spreadProps$2(__spreadValues$2({}, subSchema), {
          nullable: true
        }))
      };
    }
    return s;
  }, {
    clone: true
  });
}
function walkJsonSchema(schema, callback, options) {
  schema = callback((options == null ? void 0 : options.clone) ? deepmerge__default["default"](schema, {}) : schema);
  if (schema.type === "object" && schema.properties) {
    for (const key in schema.properties) {
      schema.properties[key] = walkJsonSchema(schema.properties[key], callback);
    }
  }
  if (schema.type === "array" && Array.isArray(schema.items)) {
    schema.items = schema.items.map((item) => walkJsonSchema(item, callback));
  }
  if (schema.type === "array" && schema.items) {
    schema.items = walkJsonSchema(schema.items, callback);
  }
  if (schema.oneOf) {
    schema.oneOf = schema.oneOf.map((subSchema) => walkJsonSchema(subSchema, callback));
  }
  if (schema.anyOf) {
    schema.anyOf = schema.anyOf.map((subSchema) => walkJsonSchema(subSchema, callback));
  }
  if (schema.allOf) {
    schema.allOf = schema.allOf.map((subSchema) => walkJsonSchema(subSchema, callback));
  }
  if (typeof schema.additionalProperties === "object") {
    schema.additionalProperties = walkJsonSchema(schema.additionalProperties, callback);
  }
  return schema;
}

function is(input, factory) {
  const factories = v3.z;
  return factory === factories[input._def.typeName];
}
function zodV3ToOpenAPI(zodType, visited = /* @__PURE__ */ new Set()) {
  const object = {};
  if (zodType.description) {
    object.description = zodType.description;
  }
  if (is(zodType, v3.z.ZodString)) {
    const { checks } = zodType._def;
    object.type = "string";
    for (const check of checks) {
      if (check.kind === "min") {
        object.minLength = check.value;
      } else if (check.kind === "max") {
        object.maxLength = check.value;
      } else if (check.kind === "email") {
        object.format = "email";
      } else if (check.kind === "url") {
        object.format = "uri";
      } else if (check.kind === "uuid") {
        object.format = "uuid";
      } else if (check.kind === "cuid") {
        object.format = "cuid";
      } else if (check.kind === "regex") {
        object.pattern = check.regex.source;
      } else if (check.kind === "datetime") {
        object.format = "date-time";
      }
    }
  }
  if (is(zodType, v3.z.ZodBoolean)) {
    object.type = "boolean";
  }
  if (is(zodType, v3.z.ZodNumber)) {
    const { checks } = zodType._def;
    object.type = "number";
    for (const check of checks) {
      if (check.kind === "int") {
        object.type = "integer";
      } else if (check.kind === "min") {
        object.minimum = check.value;
        object.exclusiveMinimum = !check.inclusive;
      } else if (check.kind === "max") {
        object.maximum = check.value;
        object.exclusiveMaximum = !check.inclusive;
      } else if (check.kind === "multipleOf") {
        object.multipleOf = check.value;
      }
    }
  }
  if (is(zodType, v3.z.ZodBigInt)) {
    object.type = "integer";
    object.format = "int64";
  }
  if (is(zodType, v3.z.ZodArray)) {
    const { minLength, maxLength, type } = zodType._def;
    object.type = "array";
    if (minLength)
      object.minItems = minLength.value;
    if (maxLength)
      object.maxItems = maxLength.value;
    object.items = zodV3ToOpenAPI(type, visited);
  }
  if (is(zodType, v3.z.ZodTuple)) {
    const { items } = zodType._def;
    object.type = "array";
    object.items = { oneOf: items.map((item) => zodV3ToOpenAPI(item, visited)) };
  }
  if (is(zodType, v3.z.ZodSet)) {
    const { valueType, minSize, maxSize } = zodType._def;
    object.type = "array";
    if (minSize)
      object.minItems = minSize.value;
    if (maxSize)
      object.maxItems = maxSize.value;
    object.items = zodV3ToOpenAPI(valueType, visited);
    object.uniqueItems = true;
  }
  if (is(zodType, v3.z.ZodUnion)) {
    const { options } = zodType._def;
    object.oneOf = options.map((option) => zodV3ToOpenAPI(option, visited));
  }
  if (is(zodType, v3.z.ZodDiscriminatedUnion)) {
    const { options } = zodType._def;
    object.oneOf = [];
    for (const schema of options.values()) {
      object.oneOf.push(zodV3ToOpenAPI(schema, visited));
    }
  }
  if (is(zodType, v3.z.ZodLiteral)) {
    const { value } = zodType._def;
    if (typeof value === "string") {
      object.type = "string";
      object.enum = [value];
    }
    if (typeof value === "number") {
      object.type = "number";
      object.minimum = value;
      object.maximum = value;
    }
    if (typeof value === "boolean") {
      object.type = "boolean";
    }
  }
  if (is(zodType, v3.z.ZodEnum)) {
    const { values } = zodType._def;
    object.type = "string";
    object.enum = values;
  }
  if (is(zodType, v3.z.ZodNativeEnum)) {
    const { values } = zodType._def;
    object.type = "string";
    object.enum = Object.values(values);
    object["x-enumNames"] = Object.keys(values);
  }
  if (is(zodType, v3.z.ZodTransformer)) {
    const { schema } = zodType._def;
    Object.assign(object, zodV3ToOpenAPI(schema, visited));
  }
  if (is(zodType, v3.z.ZodNullable)) {
    const { innerType } = zodType._def;
    Object.assign(object, zodV3ToOpenAPI(innerType, visited));
    object.nullable = true;
  }
  if (is(zodType, v3.z.ZodOptional)) {
    const { innerType } = zodType._def;
    Object.assign(object, zodV3ToOpenAPI(innerType, visited));
  }
  if (is(zodType, v3.z.ZodDefault)) {
    const { defaultValue, innerType } = zodType._def;
    Object.assign(object, zodV3ToOpenAPI(innerType, visited));
    object.default = defaultValue();
  }
  if (is(zodType, v3.z.ZodObject)) {
    const { shape } = zodType._def;
    object.type = "object";
    object.properties = {};
    object.required = [];
    for (const [key, schema] of Object.entries(shape())) {
      object.properties[key] = zodV3ToOpenAPI(schema, visited);
      const optionalTypes = [v3.z.ZodOptional.name, v3.z.ZodDefault.name];
      const isOptional = optionalTypes.includes(schema.constructor.name);
      if (!isOptional)
        object.required.push(key);
    }
    if (object.required.length === 0) {
      delete object.required;
    }
  }
  if (is(zodType, v3.z.ZodRecord)) {
    const { valueType } = zodType._def;
    object.type = "object";
    object.additionalProperties = zodV3ToOpenAPI(valueType, visited);
  }
  if (is(zodType, v3.z.ZodIntersection)) {
    const { left, right } = zodType._def;
    const merged = deepmerge__default["default"](
      zodV3ToOpenAPI(left, visited),
      zodV3ToOpenAPI(right, visited),
      {
        arrayMerge: (target, source) => {
          const mergedSet = /* @__PURE__ */ new Set([...target, ...source]);
          return Array.from(mergedSet);
        }
      }
    );
    Object.assign(object, merged);
  }
  if (is(zodType, v3.z.ZodEffects)) {
    const { schema } = zodType._def;
    Object.assign(object, zodV3ToOpenAPI(schema, visited));
  }
  if (is(zodType, v3.z.ZodLazy)) {
    const { getter } = zodType._def;
    if (visited.has(getter))
      return object;
    visited.add(getter);
    Object.assign(object, zodV3ToOpenAPI(getter(), visited));
  }
  return object;
}

var __defProp$4 = Object.defineProperty;
var __defProps$1 = Object.defineProperties;
var __getOwnPropDescs$1 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$1 = Object.getOwnPropertySymbols;
var __hasOwnProp$1 = Object.prototype.hasOwnProperty;
var __propIsEnum$1 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$4(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$1 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$1.call(b, prop))
      __defNormalProp$1(a, prop, b[prop]);
  if (__getOwnPropSymbols$1)
    for (var prop of __getOwnPropSymbols$1(b)) {
      if (__propIsEnum$1.call(b, prop))
        __defNormalProp$1(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$1 = (a, b) => __defProps$1(a, __getOwnPropDescs$1(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp$1.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols$1)
    for (var prop of __getOwnPropSymbols$1(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum$1.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
function createZodDto(schema) {
  class AugmentedZodDto {
    static create(input) {
      return this.schema.parse(input);
    }
    static get Output() {
      assert("_zod" in schema, "Output DTOs can only be created from zod v4 schemas");
      class AugmentedZodDto2 {
        static create(input) {
          return this.schema.parse(input);
        }
        static _OPENAPI_METADATA_FACTORY() {
          return openApiMetadataFactory({ schema: this.schema, io: "output" });
        }
      }
      AugmentedZodDto2.isZodDto = true;
      AugmentedZodDto2.schema = schema;
      AugmentedZodDto2.io = "output";
      Object.defineProperty(AugmentedZodDto2, "name", { value: `${this.name}_Output` });
      return AugmentedZodDto2;
    }
    static _OPENAPI_METADATA_FACTORY() {
      return openApiMetadataFactory({ schema: this.schema, io: "input" });
    }
  }
  AugmentedZodDto.isZodDto = true;
  AugmentedZodDto.schema = schema;
  AugmentedZodDto.io = "input";
  return AugmentedZodDto;
}
function openApiMetadataFactory({
  schema,
  io
}) {
  var _b;
  if (!("_zod" in schema) && "_def" in schema && io === "output") {
    throw new Error("[nestjs-zod] Output schemas are not supported for zod@v3");
  }
  if (!("_zod" in schema) && !("_def" in schema)) {
    return {};
  }
  const _a = generateJsonSchema(schema, io), { $defs, $schema } = _a, generatedJsonSchema = __objRest(_a, ["$defs", "$schema"]);
  const jsonSchema = !isObjectTypeWithProperties(generatedJsonSchema) ? {
    type: "object",
    properties: {
      root: __spreadProps$1(__spreadValues$1({}, generatedJsonSchema), {
        [UNWRAP_ROOT_KEY]: true
      })
    },
    $defs
  } : __spreadProps$1(__spreadValues$1({}, generatedJsonSchema), {
    $defs
  });
  const { hasRefs, hasNull } = getSchemaMetadata(jsonSchema);
  let properties = {};
  for (let [propertyKey, propertySchema] of Object.entries(jsonSchema.properties || {})) {
    const newPropertySchema = __spreadProps$1(__spreadValues$1({}, propertySchema), {
      type: propertySchema.type || ""
    });
    if (hasNull) {
      newPropertySchema[HAS_NULL_KEY] = true;
    }
    if (hasRefs) {
      newPropertySchema[PARENT_HAS_REFS_KEY] = true;
    }
    if (typeof propertySchema.type !== "string") {
      newPropertySchema[EMPTY_TYPE_KEY] = true;
    }
    const required = Boolean("required" in jsonSchema && ((_b = jsonSchema.required) == null ? void 0 : _b.includes(propertyKey)));
    if (newPropertySchema.type === "object") {
      newPropertySchema.selfRequired = required;
    } else {
      newPropertySchema.required = required;
    }
    if (jsonSchema.$defs) {
      newPropertySchema[DEFS_KEY] = jsonSchema.$defs;
    }
    if (jsonSchema.id) {
      newPropertySchema[PARENT_ID_KEY] = jsonSchema.id;
    }
    if (typeof jsonSchema.additionalProperties === "boolean") {
      newPropertySchema[PARENT_ADDITIONAL_PROPERTIES_KEY] = jsonSchema.additionalProperties;
    }
    properties[propertyKey] = newPropertySchema;
  }
  return properties;
}
function generateJsonSchema(schema, io) {
  const generatedJsonSchema = "_zod" in schema ? core.toJSONSchema(schema, {
    io,
    override: ({ jsonSchema }) => {
      if (io === "output" && "id" in jsonSchema) {
        jsonSchema.id = `${jsonSchema.id}_Output`;
      }
    }
  }) : zodV3ToOpenAPI(schema);
  const $defs = "$defs" in generatedJsonSchema && generatedJsonSchema.$defs ? generatedJsonSchema.$defs : void 0;
  const newSchema = walkJsonSchema(generatedJsonSchema, (schema2) => {
    if (schema2.$ref && schema2.$ref.startsWith("#/$defs/")) {
      const defKey = schema2.$ref.replace("#/$defs/", "");
      const defId = $defs == null ? void 0 : $defs[defKey].id;
      if (defId) {
        schema2.$ref = `#/$defs/${defId}`;
      }
    }
    return schema2;
  }, { clone: true });
  const newDefs = {};
  Object.entries($defs || {}).forEach(([defKey, defValue]) => {
    if (defValue.id) {
      const newKey = defValue.id || defKey;
      if (newDefs[newKey]) {
        throw new Error(`[nestjs-zod] Duplicate id in $defs: ${newKey}`);
      }
      newDefs[newKey] = defValue;
    } else {
      newDefs[defKey] = defValue;
    }
  });
  if ($defs) {
    newSchema.$defs = newDefs;
  }
  return newSchema;
}
function getSchemaMetadata(jsonSchema) {
  let hasRefs = false;
  let hasNull = false;
  walkJsonSchema(jsonSchema, (schema) => {
    if (schema.type === "null") {
      hasNull = true;
    }
    if (schema.$ref) {
      hasRefs = true;
    }
    return schema;
  });
  return {
    hasRefs,
    hasNull
  };
}
function isZodDto(metatype) {
  return Boolean(metatype && (typeof metatype === "object" || typeof metatype === "function") && "isZodDto" in metatype && metatype.isZodDto);
}
function isObjectTypeWithProperties(jsonSchema) {
  return jsonSchema.type === "object" && !!jsonSchema.properties && Object.keys(jsonSchema.properties).length > 0;
}

class ZodValidationException extends common.BadRequestException {
  constructor(error) {
    super({
      statusCode: common.HttpStatus.BAD_REQUEST,
      message: "Validation failed",
      errors: error && typeof error === "object" && "issues" in error ? error.issues : void 0
    });
    this.error = error;
  }
  getZodError() {
    return this.error;
  }
}
class ZodSerializationException extends common.InternalServerErrorException {
  constructor(error) {
    super();
    this.error = error;
  }
  getZodError() {
    return this.error;
  }
}
const createZodValidationException = (error) => {
  return new ZodValidationException(error);
};
const createZodSerializationException = (error) => {
  return new ZodSerializationException(error);
};

function validate(value, schemaOrDto, createValidationException = createZodValidationException) {
  const schema = isZodDto(schemaOrDto) ? schemaOrDto.schema : schemaOrDto;
  try {
    return schema.parse(value);
  } catch (error) {
    throw createValidationException(error);
  }
}

var __defProp$3 = Object.defineProperty;
var __getOwnPropDesc$2 = Object.getOwnPropertyDescriptor;
var __decorateClass$2 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$2(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp$3(target, key, result);
  return result;
};
function createZodGuard({
  createValidationException
} = {}) {
  let ZodGuard2 = class {
    constructor(source, schemaOrDto) {
      this.source = source;
      this.schemaOrDto = schemaOrDto;
    }
    canActivate(context) {
      const data = context.switchToHttp().getRequest()[this.source];
      validate(data, this.schemaOrDto, createValidationException);
      return true;
    }
  };
  ZodGuard2 = __decorateClass$2([
    common.Injectable()
  ], ZodGuard2);
  return ZodGuard2;
}
const ZodGuard = createZodGuard();
const UseZodGuard = (source, schemaOrDto) => common.UseGuards(new ZodGuard(source, schemaOrDto));

var __defProp$2 = Object.defineProperty;
var __getOwnPropDesc$1 = Object.getOwnPropertyDescriptor;
var __decorateClass$1 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$1(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp$2(target, key, result);
  return result;
};
var __decorateParam$1 = (index, decorator) => (target, key) => decorator(target, key, index);
function createZodValidationPipe({
  createValidationException
} = {}) {
  let ZodValidationPipe2 = class {
    constructor(schemaOrDto) {
      this.schemaOrDto = schemaOrDto;
    }
    transform(value, metadata) {
      if (this.schemaOrDto) {
        return validate(value, this.schemaOrDto, createValidationException);
      }
      const { metatype } = metadata;
      if (!isZodDto(metatype)) {
        return value;
      }
      return validate(value, metatype.schema, createValidationException);
    }
  };
  ZodValidationPipe2 = __decorateClass$1([
    common.Injectable(),
    __decorateParam$1(0, common.Optional())
  ], ZodValidationPipe2);
  return ZodValidationPipe2;
}
const ZodValidationPipe = createZodValidationPipe();

var __defProp$1 = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp$1(target, key, result);
  return result;
};
var __decorateParam = (index, decorator) => (target, key) => decorator(target, key, index);
const REFLECTOR = "Reflector";
const ZodSerializerDtoOptions = "ZOD_SERIALIZER_DTO_OPTIONS";
function ZodSerializerDto(dto) {
  if (Array.isArray(dto)) {
    const schema = "schema" in dto[0] ? dto[0].schema : dto[0];
    assert("array" in schema && typeof schema.array === "function", "ZodSerializerDto was used with array syntax (e.g. `ZodSerializerDto([MyDto])`) but the DTO schema does not have an array method");
  }
  return common.SetMetadata(ZodSerializerDtoOptions, dto);
}
exports.ZodSerializerInterceptor = class {
  constructor(reflector) {
    this.reflector = reflector;
  }
  intercept(context, next) {
    const responseSchema = this.getContextResponseSchema(context);
    return next.handle().pipe(
      rxjs.map((res) => {
        if (!responseSchema)
          return res;
        if (typeof res !== "object" || res instanceof common.StreamableFile)
          return res;
        if (Array.isArray(responseSchema)) {
          const schema = "schema" in responseSchema[0] ? responseSchema[0].schema : responseSchema[0];
          assert("array" in schema && typeof schema.array === "function", "ZodSerializerDto was used with array syntax (e.g. `ZodSerializerDto([MyDto])`) but the DTO schema does not have an array method");
          return validate(res, schema.array(), createZodSerializationException);
        }
        return validate(res, responseSchema, createZodSerializationException);
      })
    );
  }
  getContextResponseSchema(context) {
    return this.reflector.getAllAndOverride(ZodSerializerDtoOptions, [
      context.getHandler(),
      context.getClass()
    ]);
  }
};
exports.ZodSerializerInterceptor = __decorateClass([
  common.Injectable(),
  __decorateParam(0, common.Inject(REFLECTOR))
], exports.ZodSerializerInterceptor);

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
function cleanupOpenApiDoc(doc, { version: versionParam = "auto" } = {}) {
  var _a;
  const schemas = {};
  const renames = {};
  const version = versionParam === "auto" ? doc.openapi.startsWith("3.1") ? "3.1" : "3.0" : versionParam;
  for (let [oldSchemaName, oldOpenapiSchema] of Object.entries(((_a = doc.components) == null ? void 0 : _a.schemas) || {})) {
    if (!("type" in oldOpenapiSchema) || oldOpenapiSchema.type !== "object") {
      schemas[oldSchemaName] = oldOpenapiSchema;
      continue;
    }
    let newSchemaName = oldSchemaName;
    let addedDefs = false;
    let hasRefs = false;
    let hasNull = false;
    const defRenames = {};
    let newOpenapiSchema = deepmerge__default["default"]({}, oldOpenapiSchema);
    for (let propertySchema of Object.values(newOpenapiSchema.properties || {})) {
      if (HAS_NULL_KEY in propertySchema) {
        hasNull = Boolean(propertySchema[HAS_NULL_KEY]);
        delete propertySchema[HAS_NULL_KEY];
      }
      if (PARENT_HAS_REFS_KEY in propertySchema) {
        hasRefs = Boolean(propertySchema[PARENT_HAS_REFS_KEY]);
        delete propertySchema[PARENT_HAS_REFS_KEY];
      }
      if (EMPTY_TYPE_KEY in propertySchema && propertySchema[EMPTY_TYPE_KEY]) {
        delete propertySchema[EMPTY_TYPE_KEY];
        if ("type" in propertySchema && propertySchema.type === "") {
          delete propertySchema.type;
        }
      }
      if (PARENT_ID_KEY in propertySchema && typeof propertySchema[PARENT_ID_KEY] === "string") {
        Object.assign(newOpenapiSchema, { id: propertySchema[PARENT_ID_KEY] });
        newSchemaName = propertySchema[PARENT_ID_KEY];
        delete propertySchema[PARENT_ID_KEY];
      }
      if (PARENT_ADDITIONAL_PROPERTIES_KEY in propertySchema && typeof propertySchema[PARENT_ADDITIONAL_PROPERTIES_KEY] === "boolean") {
        newOpenapiSchema.additionalProperties = propertySchema[PARENT_ADDITIONAL_PROPERTIES_KEY];
        delete propertySchema[PARENT_ADDITIONAL_PROPERTIES_KEY];
      }
      if (DEFS_KEY in propertySchema) {
        const defs = propertySchema[DEFS_KEY];
        delete propertySchema[DEFS_KEY];
        if (!addedDefs) {
          for (let [defSchemaId, defSchema] of Object.entries(defs)) {
            if (!("id" in defSchema)) {
              defRenames[defSchemaId] = `${newSchemaName}${defSchemaId}`;
            }
          }
          for (let [defSchemaId, defSchema] of Object.entries(defs)) {
            let fixedDef = fixAllRefs({ schema: defSchema, rootSchemaName: newSchemaName, defRenames });
            if (version === "3.0") {
              fixedDef = fixNull(fixedDef);
            }
            const newDefSchemaKey = defRenames[defSchemaId] || defSchemaId;
            if (schemas[newDefSchemaKey] && !node_util.isDeepStrictEqual(schemas[newDefSchemaKey], fixedDef)) {
              throw new Error(`[cleanupOpenApiDoc] Found multiple schemas with name \`${newDefSchemaKey}\`.  Please review your schemas to ensure that you are not using the same schema name for different schemas`);
            }
            schemas[newDefSchemaKey] = fixedDef;
          }
          addedDefs = true;
        }
      }
    }
    if (newSchemaName !== oldSchemaName) {
      renames[oldSchemaName] = newSchemaName;
      newOpenapiSchema["id"] = newSchemaName;
    }
    if (hasRefs) {
      newOpenapiSchema = fixAllRefs({
        schema: newOpenapiSchema,
        rootSchemaName: newSchemaName,
        defRenames
      });
    }
    if (hasNull && version === "3.0") {
      newOpenapiSchema = fixNull(newOpenapiSchema);
    }
    if (newOpenapiSchema.properties && "root" in newOpenapiSchema.properties && UNWRAP_ROOT_KEY in newOpenapiSchema.properties.root) {
      const replaceRoot = newOpenapiSchema.properties.root[UNWRAP_ROOT_KEY];
      delete newOpenapiSchema.properties.root[UNWRAP_ROOT_KEY];
      if (replaceRoot) {
        newOpenapiSchema = newOpenapiSchema.properties.root;
      }
    }
    if (schemas[newSchemaName] && !node_util.isDeepStrictEqual(schemas[newSchemaName], newOpenapiSchema)) {
      throw new Error(`[cleanupOpenApiDoc] Found multiple schemas with name \`${newSchemaName}\`.  Please review your schemas to ensure that you are not using the same schema name for different schemas`);
    }
    schemas[newSchemaName] = newOpenapiSchema;
  }
  const paths = deepmerge__default["default"](doc.paths, {});
  for (let { get, patch, post, delete: del, put, head } of Object.values(paths)) {
    for (let methodObject of Object.values({ get, patch, post, del, put, head })) {
      const content = (methodObject == null ? void 0 : methodObject.requestBody) && "content" in (methodObject == null ? void 0 : methodObject.requestBody) && (methodObject == null ? void 0 : methodObject.requestBody.content) || {};
      for (let requestBodyObject of Object.values(content)) {
        if (requestBodyObject.schema && "$ref" in requestBodyObject.schema) {
          const oldSchemaName = getSchemaNameFromRef(requestBodyObject.schema.$ref);
          if (renames[oldSchemaName]) {
            const newSchemaName = renames[oldSchemaName];
            requestBodyObject.schema.$ref = requestBodyObject.schema.$ref.replace(`/${oldSchemaName}`, `/${newSchemaName}`);
          }
        }
      }
      for (let statusCodeObject of Object.values((methodObject == null ? void 0 : methodObject.responses) || {})) {
        const content2 = statusCodeObject && "content" in statusCodeObject && statusCodeObject.content || {};
        for (let responseBodyObject of Object.values(content2)) {
          if (responseBodyObject.schema && "$ref" in responseBodyObject.schema) {
            const oldSchemaName = getSchemaNameFromRef(responseBodyObject.schema.$ref);
            if (renames[oldSchemaName]) {
              const newSchemaName = renames[oldSchemaName];
              responseBodyObject.schema.$ref = responseBodyObject.schema.$ref.replace(`/${oldSchemaName}`, `/${newSchemaName}`);
            }
          }
        }
      }
      for (let parameter of (methodObject == null ? void 0 : methodObject.parameters) || []) {
        if (EMPTY_TYPE_KEY in parameter) {
          delete parameter[EMPTY_TYPE_KEY];
          if ("schema" in parameter && parameter.schema && "type" in parameter.schema) {
            delete parameter.schema.type;
          }
        }
        if (UNWRAP_ROOT_KEY in parameter) {
          throw new Error(`[cleanupOpenApiDoc] Query or url parameters must be an object type`);
        }
        if (DEFS_KEY in parameter) {
          const defs = parameter[DEFS_KEY];
          delete parameter[DEFS_KEY];
          for (let [defSchemaId, defSchema] of Object.entries(defs)) {
            let fixedDef;
            try {
              fixedDef = fixAllRefs({ schema: defSchema });
            } catch (err) {
              if (err instanceof Error && err.message.startsWith("[fixAllRefs]")) {
                throw new Error(`[cleanupOpenApiDoc] Recursive schemas are not supported for parameters`, { cause: err });
              }
              throw err;
            }
            if (schemas[defSchemaId] && !node_util.isDeepStrictEqual(schemas[defSchemaId], fixedDef)) {
              throw new Error(`[cleanupOpenApiDoc] Found multiple schemas with name \`${defSchemaId}\`.  Please review your schemas to ensure that you are not using the same schema name for different schemas`);
            }
            schemas[defSchemaId] = fixedDef;
          }
        }
        if (PARENT_HAS_REFS_KEY in parameter) {
          delete parameter[PARENT_HAS_REFS_KEY];
          if ("schema" in parameter) {
            try {
              parameter.schema = fixAllRefs({ schema: parameter.schema });
            } catch (err) {
              if (err instanceof Error && err.message.startsWith("[fixAllRefs]")) {
                throw new Error(`[cleanupOpenApiDoc] Recursive schemas are not supported for parameters`, { cause: err });
              }
              throw err;
            }
          }
        }
        if (PARENT_ID_KEY in parameter) {
          delete parameter[PARENT_ID_KEY];
        }
      }
    }
  }
  return __spreadProps(__spreadValues({}, doc), {
    paths,
    components: __spreadProps(__spreadValues({}, doc.components), {
      schemas
    })
  });
}
function getSchemaNameFromRef(ref) {
  const lastSlash = ref.lastIndexOf("/");
  const schemaName = ref.slice(lastSlash + 1);
  return schemaName;
}

let ApiResponse;
try {
  ApiResponse = require("@nestjs/swagger").ApiResponse;
} catch (e) {
}
function ZodResponse({ status, description, type }) {
  assert(ApiResponse, "ZodResponse requires @nestjs/swagger to be installed");
  if (Array.isArray(type)) {
    assert(type[0].io === "input", "ZodResponse automatically uses the output version of the DTO, there is no need to use DTO.Output");
    return common.applyDecorators(...[
      ...status ? [common.HttpCode(status)] : [],
      ZodSerializerDto(type),
      ApiResponse({ status, description, type: ["_zod" in type[0].schema ? type[0].Output : type[0]] })
    ]);
  } else {
    assert(type.io === "input", "ZodResponse automatically uses the output version of the DTO, there is no need to use DTO.Output");
    return common.applyDecorators(...[
      ...status ? [common.HttpCode(status)] : [],
      ZodSerializerDto(type),
      ApiResponse({ status, description, type: "_zod" in type.schema ? type.Output : type })
    ]);
  }
}

exports.UseZodGuard = UseZodGuard;
exports.ZodGuard = ZodGuard;
exports.ZodResponse = ZodResponse;
exports.ZodSerializationException = ZodSerializationException;
exports.ZodSerializerDto = ZodSerializerDto;
exports.ZodValidationException = ZodValidationException;
exports.ZodValidationPipe = ZodValidationPipe;
exports.cleanupOpenApiDoc = cleanupOpenApiDoc;
exports.createZodDto = createZodDto;
exports.createZodGuard = createZodGuard;
exports.createZodValidationPipe = createZodValidationPipe;
exports.validate = validate;
exports.zodV3ToOpenAPI = zodV3ToOpenAPI;
