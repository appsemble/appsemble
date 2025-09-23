import { schemas } from '@appsemble/lang-sdk';
import { type Schema } from 'jsonschema';
import { cloneDeep } from 'lodash-es';
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
}: CreateAppsembleSchemaConfigOptions = {}): SchemaConfiguration {
  return {
    uri: referenceUri ?? 'appsemble://schema.json',
    fileMatch: ['app-definition.yaml'],
    schema: {
      $ref: '#/components/schemas/AppDefinition',
      components: {
        // Whatever ingests this from yaml-language-server's languageService,
        // we really don't trust it!
        // Evil stuff would happen if you don't deep clone this, never remove that part.
        // (N.B: We should also deep-freeze the schemas object in lang-sdk to make sure code crashes
        // before it messes with the schemas, but that's not a hard necessity.)
        // Evil stuff in question: schemas somehow become recursive exactly along $ref lines.
        // Some part of the languageService mangles the schemas object in place to make $refs real.
        // Problem with that: any other thing that uses the schemas now has to handle a circular
        // object.
        // Say goodbye to JSON.stringify working
        // and hello to "Maximum call stack size exceeded" when you try to use a schema validator
        schemas: mapValues(cloneDeep(schemas), addMarkdownDescriptions),
      },
    } as JSONSchema,
  };
}
