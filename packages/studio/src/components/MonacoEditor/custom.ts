import { languages, IEvent as MonacoIEvent } from 'monaco-editor';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker';
import YamlWorker from 'monaco-yaml/lib/esm/yaml.worker';
import 'monaco-yaml';

declare module 'monaco-editor' {
  // eslint-disable-next-line @typescript-eslint/no-namespace, @typescript-eslint/no-shadow
  namespace languages.yaml {
    type DiagnosticsOptions = monaco.languages.yaml.DiagnosticsOptions;
    type LanguageServiceDefaults = monaco.languages.yaml.LanguageServiceDefaults;
    export const yamlDefaults: LanguageServiceDefaults;
  }
}

declare global {
  type IEvent<T> = MonacoIEvent<T>;
}

const { getWorker } = MonacoEnvironment;
MonacoEnvironment.getWorker = (workerId, label) => {
  if (label === 'yaml') {
    return new YamlWorker();
  }
  if (label === 'json') {
    return new JsonWorker();
  }
  return getWorker(workerId, label);
};

languages.yaml.yamlDefaults.setDiagnosticsOptions({
  validate: true,
  // Format:
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
