import { schemas } from '@appsemble/lang-sdk';
import { mapValues } from '@appsemble/utils';
import { type Schema } from 'jsonschema';
import 'monaco-editor/esm/vs/editor/contrib/colorPicker/browser/colorContributions.js';
import 'monaco-editor/esm/vs/editor/contrib/comment/browser/comment.js';
import 'monaco-editor/esm/vs/editor/contrib/contextmenu/browser/contextmenu.js';
import 'monaco-editor/esm/vs/editor/contrib/find/browser/findController.js';
import 'monaco-editor/esm/vs/editor/contrib/folding/browser/folding.js';
import 'monaco-editor/esm/vs/editor/contrib/format/browser/formatActions.js';
import 'monaco-editor/esm/vs/editor/contrib/hover/browser/hover.js';
import 'monaco-editor/esm/vs/editor/contrib/inlineCompletions/browser/inlineCompletions.contribution.js';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.js';
import 'monaco-editor/esm/vs/language/css/monaco.contribution.js';
import 'monaco-editor/esm/vs/language/json/monaco.contribution.js';
import { configureMonacoYaml, type JSONSchema } from 'monaco-yaml';

import { appValidationLabel } from './appValidation/index.js';
import './languages.js';

const cssData: monaco.languages.css.Options = {
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

monaco.languages.css.cssDefaults.setOptions(cssData);
monaco.languages.css.scssDefaults.setOptions(cssData);
monaco.languages.css.lessDefaults.setOptions(cssData);

window.MonacoEnvironment = {
  getWorker(workerId, label) {
    switch (label) {
      case appValidationLabel:
        return new Worker(new URL('appValidation/worker', import.meta.url));
      case 'css':
        return new Worker(new URL('monaco-editor/esm/vs/language/css/css.worker', import.meta.url));
      case 'editorWorkerService':
        return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url));
      case 'json':
        return new Worker(
          new URL('monaco-editor/esm/vs/language/json/json.worker', import.meta.url),
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

configureMonacoYaml(monaco, {
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
