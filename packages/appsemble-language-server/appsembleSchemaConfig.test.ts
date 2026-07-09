import { describe, expect, it } from 'vitest';

import { createAppsembleSchemaConfig } from './appsembleSchemaConfig.js';

describe('createAppsembleSchemaConfig', () => {
  it('registers the Appsemble app definition schema for app-definition.yaml', () => {
    const [config] = createAppsembleSchemaConfig();

    expect(config.uri).toBe('appsemble://schema.json');
    expect(config.fileMatch).toStrictEqual(['app-definition.yaml']);
    expect((config.schema as { $ref: string }).$ref).toBe('#/definitions/AppDefinition');
  });

  it('includes the app definition schema its $ref points at', () => {
    const [config] = createAppsembleSchemaConfig();

    const { definitions } = config.schema as { definitions: Record<string, unknown> };
    expect(definitions.AppDefinition).toBeDefined();
  });

  it('rewrites OpenAPI component references to local schema definitions', () => {
    const [config] = createAppsembleSchemaConfig();

    const serialized = JSON.stringify(config.schema);
    expect(serialized).toContain('#/definitions/ActionDefinition');
    expect(serialized).not.toContain('#/components/schemas/');
  });

  it('starts with an empty block definition so blocks are filled in at runtime', () => {
    const [config] = createAppsembleSchemaConfig();

    const { definitions } = config.schema as { definitions: Record<string, unknown> };
    expect((definitions.BlockDefinition as { allOf: unknown }).allOf).toStrictEqual([
      { allOf: [] },
    ]);
  });

  it('exposes the reference URI on the schema when provided', () => {
    const [config] = createAppsembleSchemaConfig({ referenceUri: 'https://appsemble.app' });

    expect((config.schema as { url: string }).url).toBe('https://appsemble.app');
  });
});
