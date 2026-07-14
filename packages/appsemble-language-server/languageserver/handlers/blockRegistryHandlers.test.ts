import { type LanguageService } from 'yaml-language-server';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { describe, expect, it, vi } from 'vitest';

import { BlockRegistryHandlers } from './blockRegistryHandlers.js';
import { type ValidationHandler } from './validationHandlers.js';
import { createAppsembleSchemaConfig } from '../../appsembleSchemaConfig.js';
import { BlockSchemaRequestHandler } from '../../BlockSchemaRequestHandler.js';
import { type Logger } from '../../Logger.js';
import { SettingsState } from '../../yamlSettings.js';
import { BlockManifestCacher } from '../utils/BlockManifestCacher.js';
import { YamlCacher } from '../utils/YamlCacher.js';

const logger = { log: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() } as unknown as Logger;

/**
 * A document manager standing in for the editor, exposing only the set of open documents.
 */
class FakeDocuments {
  open: TextDocument[] = [];

  all(): TextDocument[] {
    return this.open;
  }
}

function appDefinition(type: string, version: string): TextDocument {
  const yaml = [
    'name: Test app',
    'defaultPage: Home',
    'pages:',
    '  - name: Home',
    '    blocks:',
    `      - type: ${type}`,
    `        version: ${version}`,
  ].join('\n');
  return TextDocument.create('file:///app-definition.yaml', 'yaml', 1, yaml);
}

function okResponse(body: unknown): Response {
  return { ok: true, json: () => Promise.resolve(body) } as unknown as Response;
}

function notOkResponse(): Response {
  return { ok: false, json: () => Promise.resolve(null) } as unknown as Response;
}

interface Harness {
  documents: FakeDocuments;
  settings: SettingsState;
  blockSchemaRequestHandler: BlockSchemaRequestHandler;
  schemaUpdater: () => Promise<boolean>;
  modifySchemaContent: ReturnType<typeof vi.fn>;
  resetSchema: ReturnType<typeof vi.fn>;
  fetchMock: ReturnType<typeof vi.fn>;
}

function setup(): Harness {
  const settings = new SettingsState();
  settings.schemaConfigurationSettings = createAppsembleSchemaConfig();
  const documents = new FakeDocuments();
  settings.documents = documents as unknown as SettingsState['documents'];

  const blockManifestCacher = new BlockManifestCacher(settings.blockRegistryBaseUrl, logger);
  const blockSchemaRequestHandler = new BlockSchemaRequestHandler(blockManifestCacher, logger);
  const modifySchemaContent = vi.fn();
  const resetSchema = vi.fn();
  const languageService = { modifySchemaContent, resetSchema } as unknown as LanguageService;
  let schemaUpdater: (() => Promise<boolean>) | undefined;
  const validationHandler = {
    setBlockSchemaUpdater: vi.fn((updater: () => Promise<boolean>) => {
      schemaUpdater = updater;
    }),
  } as unknown as ValidationHandler;

  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);

  new BlockRegistryHandlers(
    settings,
    new YamlCacher(),
    blockManifestCacher,
    blockSchemaRequestHandler,
    languageService,
    validationHandler,
    logger,
  ).registerHandlers();

  if (!schemaUpdater) {
    throw new Error('Expected block registry handler to register a schema updater');
  }

  return {
    documents,
    settings,
    blockSchemaRequestHandler,
    schemaUpdater,
    modifySchemaContent,
    resetSchema,
    fetchMock,
  };
}

describe('BlockRegistryHandlers', () => {
  it('registers a known block so its schema becomes available for validation', async () => {
    const h = setup();
    h.fetchMock.mockResolvedValue(okResponse({ name: '@appsemble/markdown' }));
    h.documents.open = [appDefinition('markdown', '1.2.3')];

    expect(await h.schemaUpdater()).toBe(true);

    const titles = h.blockSchemaRequestHandler.availableBlockRefs.allOf.map(
      (entry) => (entry as { title: string }).title,
    );
    expect(titles).toStrictEqual(['@appsemble/markdown v1.2.3']);
    expect(h.fetchMock.mock.calls[0][0]).toContain(
      '/api/blocks/@appsemble/markdown/versions/1.2.3',
    );
  });

  it('keeps registered block refs in the source schema config for later settings updates', async () => {
    const h = setup();
    h.fetchMock.mockResolvedValue(okResponse({ name: '@appsemble/markdown' }));
    h.documents.open = [appDefinition('markdown', '1.2.3')];

    await h.schemaUpdater();

    const appsembleSchema = h.settings.schemaConfigurationSettings.find(
      (schema) => schema.uri === 'appsemble://schema.json',
    )?.schema as { definitions?: { BlockDefinition?: { allOf?: unknown[] } } };
    expect(appsembleSchema.definitions?.BlockDefinition?.allOf).toStrictEqual([
      h.blockSchemaRequestHandler.availableBlockRefs,
    ]);
  });

  it('does not update the schema when the block set has not changed', async () => {
    const h = setup();
    h.fetchMock.mockResolvedValue(okResponse({ name: '@appsemble/markdown' }));
    h.documents.open = [appDefinition('markdown', '1.2.3')];

    expect(await h.schemaUpdater()).toBe(true);
    expect(await h.schemaUpdater()).toBe(false);

    expect(h.fetchMock).toHaveBeenCalledTimes(1);
    expect(h.modifySchemaContent).toHaveBeenCalledTimes(1);
    expect(h.resetSchema).toHaveBeenCalledTimes(1);
  });

  it('shares an in-flight schema update between concurrent validation requests', async () => {
    const h = setup();
    h.fetchMock.mockResolvedValue(okResponse({ name: '@appsemble/markdown' }));
    h.documents.open = [appDefinition('markdown', '1.2.3')];

    expect(await Promise.all([h.schemaUpdater(), h.schemaUpdater()])).toStrictEqual([true, true]);

    expect(h.fetchMock).toHaveBeenCalledTimes(1);
    expect(h.modifySchemaContent).toHaveBeenCalledTimes(1);
  });

  it('ignores blocks whose version is not yet a complete semver', async () => {
    const h = setup();
    h.documents.open = [appDefinition('markdown', 'draft')];

    expect(await h.schemaUpdater()).toBe(true);

    expect(h.fetchMock).not.toHaveBeenCalled();
    expect(h.blockSchemaRequestHandler.availableBlockRefs.allOf).toStrictEqual([]);
  });

  it('does not register a block whose manifest cannot be resolved', async () => {
    const h = setup();
    h.fetchMock.mockResolvedValue(notOkResponse());
    h.documents.open = [appDefinition('unlisted', '1.0.0')];

    expect(await h.schemaUpdater()).toBe(true);

    expect(h.fetchMock).toHaveBeenCalledTimes(1);
    expect(h.blockSchemaRequestHandler.availableBlockRefs.allOf).toStrictEqual([]);
  });
});
