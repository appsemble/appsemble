import { languages } from 'monaco-editor';
import YamlWorker from 'monaco-yaml/lib/esm/yaml.worker';
import 'monaco-yaml';

declare module 'monaco-editor' {
  // eslint-disable-next-line max-len
  // eslint-disable-next-line @typescript-eslint/no-namespace, @typescript-eslint/no-shadow, @typescript-eslint/no-unused-vars
  namespace languages.yaml {
    type DiagnosticsOptions = monaco.languages.yaml.DiagnosticsOptions;
    type LanguageServiceDefaults = monaco.languages.yaml.LanguageServiceDefaults;
    export const yamlDefaults: LanguageServiceDefaults;
  }
}

const { getWorker } = MonacoEnvironment;
MonacoEnvironment.getWorker = (workerId, label) => {
  if (label === 'yaml') {
    return new YamlWorker();
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
