import { schemas } from '@appsemble/lang-sdk';
import { mapValues } from '@appsemble/utils';
import { type Schema } from 'jsonschema';
import * as monaco from 'monaco-editor/editor';
import 'monaco-editor/features/colorPicker/register';
import 'monaco-editor/features/comment/register';
import 'monaco-editor/features/contextmenu/register';
import 'monaco-editor/features/find/register';
import 'monaco-editor/features/folding/register';
import 'monaco-editor/features/format/register';
import 'monaco-editor/features/hover/register';
import 'monaco-editor/features/inlineCompletions/register';
import 'monaco-editor/features/quickCommand/register';
import {
  cssDefaults,
  lessDefaults,
  type Options as CSSOptions,
  scssDefaults,
} from 'monaco-editor/languages/features/css/register';
import 'monaco-editor/languages/features/json/register';
import { configureMonacoYaml, type JSONSchema } from 'monaco-yaml';

import { appValidationLabel } from './appValidation/index.js';
import './languages.js';

const cssData: CSSOptions = {
  validate: true,
  lint: {
    compatibleVendorPrefixes: 'ignore',
    vendorPrefix: 'warning',
    duplicateProperties: 'warning',
    emptyRules: 'warning',
    importStatement: 'ignore',
    boxModel: 'ignore',
    universalSelector: 'ignore',
    zeroUnits: 'ignore',
    fontFaceProperties: 'warning',
    hexColorLength: 'error',
    argumentsInColorFunction: 'error',
    unknownProperties: 'warning',
    ieHack: 'ignore',
    unknownVendorSpecificProperties: 'ignore',
    propertyIgnoredDueToDisplay: 'warning',
    important: 'ignore',
    float: 'ignore',
    idSelector: 'ignore',
  },
  data: {
    useDefaultDataProvider: true,
    dataProviders: {
      appsemble: {
        version: 1.1,
        // @ts-expect-error: 'functions' is supported in the CSS language service, but not yet
        // reflected in Monaco's types.
        functions: [
          {
            name: 'asset',
            description: 'Reference an app asset by its name or ID.',
          },
        ],
      },
    },
  },
  format: {
    newlineBetweenSelectors: true,
    newlineBetweenRules: true,
    spaceAroundSelectorSeparator: false,
    braceStyle: 'collapse',
    preserveNewLines: true,
  },
};

cssDefaults.setOptions(cssData);
scssDefaults.setOptions(cssData);
lessDefaults.setOptions(cssData);

window.MonacoEnvironment = {
  getWorker(workerId, label) {
    switch (label) {
      case appValidationLabel:
        return new Worker(new URL('appValidation/worker', import.meta.url));
      case 'css':
        return new Worker(
          new URL('monaco-editor/languages/features/css/css.worker', import.meta.url),
        );
      case 'editorWorkerService':
        return new Worker(new URL('monaco-editor/editor/editor.worker', import.meta.url));
      case 'json':
        return new Worker(
          new URL('monaco-editor/languages/features/json/json.worker', import.meta.url),
        );
      case 'yaml':
        return new Worker(new URL('monaco-yaml/yaml.worker', import.meta.url));
      default:
        throw new Error(`Unknown label ${label}`);
    }
  },
};

/**
 * Normalize an OpenAPI schema for the Monaco YAML JSON Schema validator.
 *
 * @param schema The schema to process.
 * @returns The normalized schema with markdown descriptions.
 */
function normalizeSchema(schema: Schema): JSONSchema {
  function normalizeValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map(normalizeValue);
    }
    if (value && typeof value === 'object') {
      const result = mapValues(value as Record<string, unknown>, normalizeValue);
      if (typeof result.$ref === 'string' && result.$ref.startsWith('#/components/schemas/')) {
        result.$ref = result.$ref.replace('#/components/schemas/', '#/definitions/');
      }
      if (typeof result.description === 'string') {
        result.markdownDescription = result.description;
      }
      return result;
    }
    return value;
  }

  return normalizeValue(schema) as JSONSchema;
}

configureMonacoYaml(monaco as unknown as Parameters<typeof configureMonacoYaml>[0], {
  completion: true,
  validate: true,
  format: { enable: true },
  enableSchemaRequest: false,
  schemas: [
    {
      uri: String(new URL('/docs/reference', window.location.origin)),
      fileMatch: ['app.yaml'],
      schema: {
        $ref: '#/definitions/AppDefinition',
        definitions: mapValues(schemas, normalizeSchema),
      },
    },
  ],
});
