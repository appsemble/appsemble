import { type OpenAPIV3 } from 'openapi-types';
import { type JsonValue } from 'type-fest';

const parser = new DOMParser();

function parseFromString(value: string, schema: OpenAPIV3.SchemaObject): JsonValue {
  switch (schema.type) {
    case 'boolean': {
      const lower = value.toLowerCase();
      if (lower === 'true') {
        return true;
      }
      if (lower === 'false') {
        return false;
      }
      return null;
    }
    case 'integer':
      return Number.parseInt(value);
    case 'number':
      return Number.parseFloat(value);
    default:
      return value;
  }
}

function matchNode(xmlObject: OpenAPIV3.XMLObject, tagName: string): (node: Element) => boolean {
  return (node) =>
    // eslint-disable-next-line eqeqeq
    node.prefix == xmlObject?.prefix && node.localName === (xmlObject?.name || tagName);
}

function processNode(
  parent: Element,
  schema: OpenAPIV3.SchemaObject,
  name?: string,
  index = 0,
): JsonValue {
  const xmlObject = schema.xml;
  if (schema.type === 'object') {
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    const child = [...parent.children].filter(matchNode(xmlObject, name))[index];
    return Object.fromEntries(
      Object.entries(schema.properties ?? {}).map(([key, childSchema]) => [
        key,
        processNode(child, childSchema as OpenAPIV3.SchemaObject, key),
      ]),
    );
  }
  if (schema.type === 'array') {
    const childNodes = [...parent.children];
    const itemSchema = schema.items as OpenAPIV3.SchemaObject;
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    const wrapper = xmlObject?.wrapped ? childNodes.find(matchNode(xmlObject, name)) : parent;
    return (
      [...(wrapper?.children ?? [])]
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks)
        .filter(matchNode(itemSchema.xml, name))
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks)
        .map((element, i) => processNode(wrapper, itemSchema, name, i))
    );
  }
  if (schema.xml?.attribute) {
    return parseFromString(
      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
      parent.getAttribute(
        (xmlObject?.prefix ? `${xmlObject.prefix}:` : '') + (xmlObject?.name || name),
      ),
      schema,
    );
  }
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  const node = [...parent.children].filter(matchNode(xmlObject, name))[index];
  if (!node) {
    return null;
  }
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  return parseFromString(node.textContent, schema);
}

export function xmlToJson(xml: string, schema: OpenAPIV3.SchemaObject): JsonValue {
  const doc = parser.parseFromString(xml, 'application/xml');
  const [errorNode] = doc.getElementsByTagName('parsererror');
  if (errorNode) {
    throw new Error(errorNode.textContent ?? undefined);
  }
  return processNode(doc as any, schema);
}
