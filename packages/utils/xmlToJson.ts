import { type OpenAPIV3 } from 'openapi-types';
import { type JsonValue } from 'type-fest';

/**
 * The part of a DOM node this module reads, as implemented by browsers and `@xmldom/xmldom`.
 */
interface XmlNode {
  children: Iterable<XmlNode>;
  prefix: string | null;
  localName: string;
  textContent: string;
  getAttribute: (name: string) => string | null;
  getElementsByTagName: (name: string) => Iterable<XmlNode>;
}

function parseFromString(value: string | null, schema: OpenAPIV3.SchemaObject): JsonValue {
  if (value == null) {
    return null;
  }
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

function matchNode(
  xmlObject: OpenAPIV3.XMLObject | undefined,
  tagName: string | undefined,
): (node: XmlNode) => boolean {
  return (node) =>
    // eslint-disable-next-line eqeqeq
    node.prefix == xmlObject?.prefix && node.localName === (xmlObject?.name || tagName);
}

function processNode(
  parent: XmlNode,
  schema: OpenAPIV3.SchemaObject,
  name?: string,
  index = 0,
): JsonValue {
  const xmlObject = schema.xml;
  if (schema.type === 'object') {
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
    const wrapper = xmlObject?.wrapped ? childNodes.find(matchNode(xmlObject, name)) : parent;
    if (!wrapper) {
      return [];
    }
    return [...wrapper.children]
      .filter(matchNode(itemSchema.xml, name))
      .map((element, i) => processNode(wrapper, itemSchema, name, i));
  }
  if (schema.xml?.attribute) {
    return parseFromString(
      parent.getAttribute(
        (xmlObject?.prefix ? `${xmlObject.prefix}:` : '') + (xmlObject?.name || name),
      ),
      schema,
    );
  }
  const node = [...parent.children].filter(matchNode(xmlObject, name))[index];
  if (!node) {
    return null;
  }
  return parseFromString(node.textContent, schema);
}

/**
 * Convert an XML document to JSON as described by the `xml` properties of an OpenAPI schema.
 *
 * @param xml The XML document to convert.
 * @param schema The schema that describes the resulting JSON.
 * @param parser The DOM parser of the platform, for example `new DOMParser()` in a browser.
 * @returns The JSON representation of the XML document.
 */
export function xmlToJson(
  xml: string,
  schema: OpenAPIV3.SchemaObject,
  parser: { parseFromString: (xml: string, mimeType: 'application/xml') => unknown },
): JsonValue {
  const doc = parser.parseFromString(xml, 'application/xml') as XmlNode;
  const [errorNode] = doc.getElementsByTagName('parsererror');
  if (errorNode) {
    throw new Error(errorNode.textContent ?? undefined);
  }
  return processNode(doc, schema);
}
