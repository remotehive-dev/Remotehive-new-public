import { toJSONSchema } from 'zod/v4/core';
import deepmerge from 'deepmerge';
import { z } from 'zod/v3';

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

function walkJsonSchema(schema, callback, options) {
  schema = callback((options == null ? void 0 : options.clone) ? deepmerge(schema, {}) : schema);
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
  const factories = z;
  return factory === factories[input._def.typeName];
}
function zodV3ToOpenAPI(zodType, visited = /* @__PURE__ */ new Set()) {
  const object = {};
  if (zodType.description) {
    object.description = zodType.description;
  }
  if (is(zodType, z.ZodString)) {
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
  if (is(zodType, z.ZodBoolean)) {
    object.type = "boolean";
  }
  if (is(zodType, z.ZodNumber)) {
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
  if (is(zodType, z.ZodBigInt)) {
    object.type = "integer";
    object.format = "int64";
  }
  if (is(zodType, z.ZodArray)) {
    const { minLength, maxLength, type } = zodType._def;
    object.type = "array";
    if (minLength)
      object.minItems = minLength.value;
    if (maxLength)
      object.maxItems = maxLength.value;
    object.items = zodV3ToOpenAPI(type, visited);
  }
  if (is(zodType, z.ZodTuple)) {
    const { items } = zodType._def;
    object.type = "array";
    object.items = { oneOf: items.map((item) => zodV3ToOpenAPI(item, visited)) };
  }
  if (is(zodType, z.ZodSet)) {
    const { valueType, minSize, maxSize } = zodType._def;
    object.type = "array";
    if (minSize)
      object.minItems = minSize.value;
    if (maxSize)
      object.maxItems = maxSize.value;
    object.items = zodV3ToOpenAPI(valueType, visited);
    object.uniqueItems = true;
  }
  if (is(zodType, z.ZodUnion)) {
    const { options } = zodType._def;
    object.oneOf = options.map((option) => zodV3ToOpenAPI(option, visited));
  }
  if (is(zodType, z.ZodDiscriminatedUnion)) {
    const { options } = zodType._def;
    object.oneOf = [];
    for (const schema of options.values()) {
      object.oneOf.push(zodV3ToOpenAPI(schema, visited));
    }
  }
  if (is(zodType, z.ZodLiteral)) {
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
  if (is(zodType, z.ZodEnum)) {
    const { values } = zodType._def;
    object.type = "string";
    object.enum = values;
  }
  if (is(zodType, z.ZodNativeEnum)) {
    const { values } = zodType._def;
    object.type = "string";
    object.enum = Object.values(values);
    object["x-enumNames"] = Object.keys(values);
  }
  if (is(zodType, z.ZodTransformer)) {
    const { schema } = zodType._def;
    Object.assign(object, zodV3ToOpenAPI(schema, visited));
  }
  if (is(zodType, z.ZodNullable)) {
    const { innerType } = zodType._def;
    Object.assign(object, zodV3ToOpenAPI(innerType, visited));
    object.nullable = true;
  }
  if (is(zodType, z.ZodOptional)) {
    const { innerType } = zodType._def;
    Object.assign(object, zodV3ToOpenAPI(innerType, visited));
  }
  if (is(zodType, z.ZodDefault)) {
    const { defaultValue, innerType } = zodType._def;
    Object.assign(object, zodV3ToOpenAPI(innerType, visited));
    object.default = defaultValue();
  }
  if (is(zodType, z.ZodObject)) {
    const { shape } = zodType._def;
    object.type = "object";
    object.properties = {};
    object.required = [];
    for (const [key, schema] of Object.entries(shape())) {
      object.properties[key] = zodV3ToOpenAPI(schema, visited);
      const optionalTypes = [z.ZodOptional.name, z.ZodDefault.name];
      const isOptional = optionalTypes.includes(schema.constructor.name);
      if (!isOptional)
        object.required.push(key);
    }
    if (object.required.length === 0) {
      delete object.required;
    }
  }
  if (is(zodType, z.ZodRecord)) {
    const { valueType } = zodType._def;
    object.type = "object";
    object.additionalProperties = zodV3ToOpenAPI(valueType, visited);
  }
  if (is(zodType, z.ZodIntersection)) {
    const { left, right } = zodType._def;
    const merged = deepmerge(
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
  if (is(zodType, z.ZodEffects)) {
    const { schema } = zodType._def;
    Object.assign(object, zodV3ToOpenAPI(schema, visited));
  }
  if (is(zodType, z.ZodLazy)) {
    const { getter } = zodType._def;
    if (visited.has(getter))
      return object;
    visited.add(getter);
    Object.assign(object, zodV3ToOpenAPI(getter(), visited));
  }
  return object;
}

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
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
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
      root: __spreadProps(__spreadValues({}, generatedJsonSchema), {
        [UNWRAP_ROOT_KEY]: true
      })
    },
    $defs
  } : __spreadProps(__spreadValues({}, generatedJsonSchema), {
    $defs
  });
  const { hasRefs, hasNull } = getSchemaMetadata(jsonSchema);
  let properties = {};
  for (let [propertyKey, propertySchema] of Object.entries(jsonSchema.properties || {})) {
    const newPropertySchema = __spreadProps(__spreadValues({}, propertySchema), {
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
  const generatedJsonSchema = "_zod" in schema ? toJSONSchema(schema, {
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

export { createZodDto, isZodDto };
