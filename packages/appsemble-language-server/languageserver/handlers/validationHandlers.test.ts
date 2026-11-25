import { describe, expect, it, vi } from 'vitest';
import { type Connection } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { type LanguageService } from 'yaml-language-server';

import { BlockRegistryHandlers } from './blockRegistryHandlers.js';
import { ValidationHandler } from './validationHandlers.js';
import { createAppsembleSchemaConfig } from '../../appsembleSchemaConfig.js';
import { BlockSchemaRequestHandler } from '../../BlockSchemaRequestHandler.js';
import { type Logger } from '../../Logger.js';
import { SettingsState } from '../../yamlSettings.js';
import { BlockManifestCacher } from '../utils/BlockManifestCacher.js';
import { YamlCacher } from '../utils/YamlCacher.js';

const logger = { log: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() } as unknown as Logger;

function appDoc(uri: string, content: string): TextDocument {
  return TextDocument.create(uri, 'yaml', 1, content);
}

interface Sent {
  uri: string;
  diagnostics: { message: string }[];
}

interface Harness {
  handler: ValidationHandler;
  open: Map<string, TextDocument>;
  sent: Sent[];
}

/**
 * Wire a `ValidationHandler` together with a `BlockRegistryHandlers`, standing in for the editor
 * with a plain document map and capturing every `sendDiagnostics` call.
 *
 * The yaml-language-server schema validation is stubbed to return nothing so the assertions target
 * the Appsemble validation path (`validateAppDefinition` results mapped to diagnostics). The block
 * registry fetch is stubbed to fail so no network access happens.
 *
 * @returns The wired validation handler, the open-document map, and the captured diagnostics.
 */
function setup(): Harness {
  const settings = new SettingsState();
  settings.validationDelayMs = 0;
  settings.schemaConfigurationSettings = createAppsembleSchemaConfig();

  const open = new Map<string, TextDocument>();
  const documents = {
    onDidChangeContent: vi.fn(),
    onDidClose: vi.fn(),
    all: () => [...open.values()],
    get: (uri: string) => open.get(uri),
  };
  settings.documents = documents as unknown as SettingsState['documents'];

  const sent: Sent[] = [];
  const connection = {
    console: { error: vi.fn(), info: vi.fn(), log: vi.fn(), warn: vi.fn() },
    sendDiagnostics: (params: Sent) => sent.push(params),
  } as unknown as Connection;

  const languageService = {
    doValidation: vi.fn(() => Promise.resolve([])),
  } as unknown as LanguageService;

  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({ ok: false, json: () => Promise.resolve(null) } as unknown as Response),
    ),
  );

  const yamlCacher = new YamlCacher();
  const blockManifestCacher = new BlockManifestCacher(settings.blockRegistryBaseUrl, logger);
  const handler = new ValidationHandler(
    connection,
    languageService,
    settings,
    yamlCacher,
    blockManifestCacher,
  );
  new BlockRegistryHandlers(
    settings,
    yamlCacher,
    blockManifestCacher,
    new BlockSchemaRequestHandler(blockManifestCacher, logger),
    { applyLanguageSettings: vi.fn() },
    handler,
    logger,
  ).registerHandlers();

  return { handler, open, sent };
}

describe('ValidationHandler', () => {
  it('reports a diagnostic when the app definition is missing a required property', async () => {
    const { handler, open, sent } = setup();
    const doc = appDoc('file:///app-definition.yaml', 'defaultPage: Home\n');
    open.set(doc.uri, doc);

    handler.validate(doc);

    await vi.waitFor(() => expect(sent).not.toHaveLength(0));
    const messages = sent
      .at(-1)!
      .diagnostics.map((diagnostic) => diagnostic.message)
      .join('\n');
    expect(messages).toMatch(/name/i);
  });

  it('keeps validating the edited file when another open file has an incomplete flow page', async () => {
    const { handler, open, sent } = setup();
    const incomplete = appDoc(
      'file:///other-app-definition.yaml',
      'name: Other\ndefaultPage: Home\npages:\n  - name: Home\n    type: flow\n',
    );
    const edited = appDoc('file:///app-definition.yaml', 'defaultPage: Home\n');
    open.set(incomplete.uri, incomplete);
    open.set(edited.uri, edited);

    handler.validate(edited);

    await vi.waitFor(() => expect(sent.some((entry) => entry.uri === edited.uri)).toBe(true));
  });
});
