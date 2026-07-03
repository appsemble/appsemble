import { type LanguageService } from 'yaml-language-server';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BlockRegistryHandlers } from './blockRegistryHandlers.js';
import { type ValidationHandler } from './validationHandlers.js';
import { BlockSchemaRequestHandler } from '../../BlockSchemaRequestHandler.js';
import { type Logger } from '../../Logger.js';
import { SettingsState } from '../../yamlSettings.js';
import { BlockManifestCacher } from '../utils/BlockManifestCacher.js';
import { YamlCacher } from '../utils/YamlCacher.js';

const logger = { log: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() } as unknown as Logger;

/**
 * A document manager standing in for the editor, exposing only what the handler consumes: a change
 * subscription and the set of open documents.
 */
class FakeDocuments {
  private handler: ((event: { document: TextDocument }) => void) | undefined;

  open: TextDocument[] = [];

  onDidChangeContent(handler: (event: { document: TextDocument }) => void): {
    dispose: () => void;
  } {
    this.handler = handler;
    return {
      dispose: () => {
        this.handler = undefined;
      },
    };
  }

  all(): TextDocument[] {
    return this.open;
  }

  fireChange(): void {
    this.handler?.({ document: this.open[0] });
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
  blockSchemaRequestHandler: BlockSchemaRequestHandler;
  modifySchemaContent: ReturnType<typeof vi.fn>;
  fetchMock: ReturnType<typeof vi.fn>;
}

function setup(): Harness {
  const settings = new SettingsState();
  const documents = new FakeDocuments();
  settings.documents = documents as unknown as SettingsState['documents'];

  const blockManifestCacher = new BlockManifestCacher(settings.blockRegistryBaseUrl, logger);
  const blockSchemaRequestHandler = new BlockSchemaRequestHandler(blockManifestCacher, logger);
  const modifySchemaContent = vi.fn();
  const languageService = { modifySchemaContent } as unknown as LanguageService;
  const validationHandler = { validate: vi.fn() } as unknown as ValidationHandler;

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

  return { documents, blockSchemaRequestHandler, modifySchemaContent, fetchMock };
}

describe('BlockRegistryHandlers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('registers a known block so its schema becomes available for validation', async () => {
    const h = setup();
    h.fetchMock.mockResolvedValue(okResponse({ name: '@appsemble/markdown' }));
    h.documents.open = [appDefinition('markdown', '1.2.3')];

    h.documents.fireChange();
    await vi.advanceTimersByTimeAsync(250);

    const titles = h.blockSchemaRequestHandler.availableBlockRefs.oneOf.map(
      (entry) => (entry as { title: string }).title,
    );
    expect(titles).toStrictEqual(['@appsemble/markdown v1.2.3']);
    expect(h.fetchMock.mock.calls[0][0]).toContain(
      '/api/blocks/@appsemble/markdown/versions/1.2.3',
    );
  });

  it('debounces rapid edits into a single delayed schema update', async () => {
    const h = setup();
    h.fetchMock.mockResolvedValue(okResponse({ name: '@appsemble/markdown' }));
    h.documents.open = [appDefinition('markdown', '1.2.3')];

    h.documents.fireChange();
    h.documents.fireChange();
    h.documents.fireChange();

    // Nothing runs until the debounce window elapses.
    await vi.advanceTimersByTimeAsync(100);
    expect(h.fetchMock).not.toHaveBeenCalled();

    // Once it elapses, the burst results in a single update.
    await vi.advanceTimersByTimeAsync(150);
    expect(h.fetchMock).toHaveBeenCalledTimes(1);
    expect(h.modifySchemaContent).toHaveBeenCalledTimes(1);
  });

  it('ignores blocks whose version is not yet a complete semver', async () => {
    const h = setup();
    h.documents.open = [appDefinition('markdown', 'draft')];

    h.documents.fireChange();
    await vi.advanceTimersByTimeAsync(250);

    expect(h.fetchMock).not.toHaveBeenCalled();
    expect(h.blockSchemaRequestHandler.availableBlockRefs.oneOf).toStrictEqual([]);
  });

  it('does not register a block whose manifest cannot be resolved', async () => {
    const h = setup();
    h.fetchMock.mockResolvedValue(notOkResponse());
    h.documents.open = [appDefinition('unlisted', '1.0.0')];

    h.documents.fireChange();
    await vi.advanceTimersByTimeAsync(250);

    expect(h.fetchMock).toHaveBeenCalledTimes(1);
    expect(h.blockSchemaRequestHandler.availableBlockRefs.oneOf).toStrictEqual([]);
  });
});
