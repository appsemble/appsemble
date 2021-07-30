import { schemas } from '@appsemble/utils';
import { Environment } from 'monaco-editor/esm/vs/editor/editor.api';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker';
import { setDiagnosticsOptions } from 'monaco-yaml';
import YamlWorker from 'monaco-yaml/lib/esm/yaml.worker';
// Webpack loader syntax is required here, because  json.worker and yaml.worker also import this
// file.
// eslint-disable-next-line import/no-webpack-loader-syntax, node/no-extraneous-import
import MonacoWorker from 'worker-loader!monaco-editor/esm/vs/editor/editor.worker';
// Cherry-picking these features makes the editor more light weight, resulting in a smaller bundle
// size and a snappier user experience.
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution';
import 'monaco-editor/esm/vs/editor/contrib/comment/comment';
import 'monaco-editor/esm/vs/editor/contrib/contextmenu/contextmenu';
import 'monaco-editor/esm/vs/editor/contrib/find/findController';
import 'monaco-editor/esm/vs/editor/contrib/folding/folding';
import 'monaco-editor/esm/vs/editor/contrib/format/formatActions';
import 'monaco-editor/esm/vs/editor/contrib/hover/hover';
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution';
import 'monaco-editor/esm/vs/language/json/monaco.contribution';

declare global {
  interface Window {
    MonacoEnvironment: Environment;
  }
}

window.MonacoEnvironment = {
  getWorker(workerId, label) {
    switch (label) {
      case 'css':
        return new CssWorker();
      case 'editorWorkerService':
        return new MonacoWorker();
      case 'json':
        return new JsonWorker();
      case 'yaml':
        return new YamlWorker();
      default:
        throw new Error(`Unknown label ${label}`);
    }
  },
};

setDiagnosticsOptions({
  completion: true,
  validate: true,
  format: true,
  enableSchemaRequest: true,
  schemas: [
    {
      fileMatch: ['*'],
      // Not sure why this is needed, but it’s required and its value may not match the ref.
      uri: String(new URL('/notapi.json', window.location.origin)),
      schema: {
        ...schemas.AppDefinition,
        components: { schemas },
      },
    },
  ],
});
