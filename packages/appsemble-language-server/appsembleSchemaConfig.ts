import { schemas } from '@appsemble/lang-sdk';
import { type Schema } from 'jsonschema';
import { cloneDeep, set } from 'lodash-es';
import { type SchemaConfiguration } from 'yaml-language-server';
import { type JSONSchema } from 'yaml-language-server/lib/esm/languageservice/jsonSchema.js';

function mapValues<T, U>(record: Record<string, T>, fn: (value: T) => U): Record<string, U> {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, fn(value)]));
}

/**
 * Create a deep clone of a JSON schema with `markdownDescriptions` set to the description.
 *
 * @param schema The schema to process.
 * @returns The schema with a markdown description.
 */
function addMarkdownDescriptions(schema: Schema): Schema {
  const result = { ...schema } as Schema & { markdownDescription?: string };
  if (result.properties) {
    result.properties = mapValues(result.properties, addMarkdownDescriptions);
  }
  if (result.patternProperties) {
    result.patternProperties = mapValues(result.patternProperties, addMarkdownDescriptions);
  }
  if (typeof result.additionalProperties === 'object') {
    result.additionalProperties = addMarkdownDescriptions(result.additionalProperties);
  }
  if (Array.isArray(result.items)) {
    result.items = result.items.map(addMarkdownDescriptions);
  }
  result.markdownDescription = result.description;
  return result;
}

interface CreateAppsembleSchemaConfigOptions {
  readonly referenceUri?: string;
}

export function createAppsembleSchemaConfig({
  referenceUri,
}: CreateAppsembleSchemaConfigOptions = {}): SchemaConfiguration[] {
  const clonedSchemas = cloneDeep(schemas);
  set(clonedSchemas, 'BlockDefinition.allOf', [{ $ref: 'appsemble://availBlocksRef.json' }]);

  return [
    {
      uri: 'appsemble://schema.json',
      fileMatch: ['app-definition.yaml'],
      schema: {
        id: 'appsemble://schema.json',
        url: referenceUri,
        $ref: '#/components/schemas/AppDefinition',
        components: {
          // Don't pass schemas you want to use outside of  the languageService
          // to the languageService..
          // It *will* mutate them
          schemas: mapValues(clonedSchemas, addMarkdownDescriptions),
        },
      } as JSONSchema,
    },
  ];
}
