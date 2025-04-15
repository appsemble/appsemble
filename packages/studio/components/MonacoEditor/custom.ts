import { mapValues, schemas } from '@appsemble/lang-sdk';
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
import { configureMonacoYaml } from 'monaco-yaml';

import { appValidationLabel } from './appValidation/index.js';
import './languages.js';

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

configureMonacoYaml(monaco, {
  completion: true,
  validate: true,
  format: true,
  enableSchemaRequest: false,
  schemas: [
    {
      fileMatch: ['app.yaml'],
      schema: {
        // TODO: focus on this now
        $ref: '#/components/schemas/AppDefinition',
        components: {
          schemas: mapValues(schemas, addMarkdownDescriptions),
        },
      },
      uri: String(new URL('/docs/reference', window.location.origin)),
    },
  ],
});
