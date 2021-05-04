import {
  Environment,
  languages,
  IEvent as MonacoIEvent,
} from 'monaco-editor/esm/vs/editor/editor.api';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker';
import YamlWorker from 'monaco-yaml/lib/esm/yaml.worker';
// Webpack loader syntax is required here, because  json.worker and yaml.worker also import this
// file.
// eslint-disable-next-line max-len
// eslint-disable-next-line import/no-unresolved, import/no-webpack-loader-syntax, node/no-extraneous-import
import MonacoWorker from 'worker-loader!monaco-editor/esm/vs/editor/editor.worker';

// Cherry-picking these features makes the editor more light weight, resulting in a smaller bundle
// size and a snappier user experience.
import 'monaco-editor/esm/vs/editor/contrib/contextmenu/contextmenu';
import 'monaco-editor/esm/vs/editor/contrib/folding/folding';
import 'monaco-editor/esm/vs/editor/contrib/format/formatActions';
import 'monaco-editor/esm/vs/editor/contrib/hover/hover';
import 'monaco-editor/esm/vs/editor/contrib/find/findController';
import 'monaco-editor/esm/vs/editor/contrib/comment/comment';
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution';
import 'monaco-editor/esm/vs/language/json/monaco.contribution';
import 'monaco-yaml';

declare module 'monaco-editor/esm/vs/editor/editor.api' {
  // eslint-disable-next-line @typescript-eslint/no-namespace, @typescript-eslint/no-shadow
  namespace languages.yaml {
    type DiagnosticsOptions = monaco.languages.yaml.DiagnosticsOptions;
    type LanguageServiceDefaults = monaco.languages.yaml.LanguageServiceDefaults;
    export const yamlDefaults: LanguageServiceDefaults;
  }
}

declare global {
  type IEvent<T> = MonacoIEvent<T>;

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

languages.yaml.yamlDefaults.setDiagnosticsOptions({
  validate: true,
  format: true,
  enableSchemaRequest: true,
  schemas: [
    {
      fileMatch: ['*'],
      // Not sure why this is needed, but it’s required and its value may not match the ref.
      uri: String(new URL('/notapi.json', window.location.origin)),
      schema: {
        $ref: String(
          new URL(
            '/api.json#/components/schemas/App/properties/definition',
            window.location.origin,
          ),
        ),
      },
    },
  ],
});
