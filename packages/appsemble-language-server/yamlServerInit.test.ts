// @vitest-environment node
import { PassThrough } from 'node:stream';
import { setTimeout as sleep } from 'node:timers/promises';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createConnection,
  createMessageConnection,
  type Diagnostic,
  type MessageConnection,
  StreamMessageReader,
  StreamMessageWriter,
} from 'vscode-languageserver/node.js';
import { workspaceContext } from 'yaml-language-server/lib/esm/languageservice/services/schemaRequestHandler.js';

import { TelemetryImpl } from './languageserver/telemetry.js';
import { YAMLServerInit } from './yamlServerInit.js';
import { SettingsState } from './yamlSettings.js';

/**
 * Block manifests served by the stubbed block registry, keyed by `name@version`.
 */
const manifests: Record<string, unknown> = Object.fromEntries(
  [
    ['@appsemble/test-alpha', '1.0.0'],
    ['@appsemble/test-alpha', '1.0.1'],
    ['@appsemble/test-beta', '1.0.0'],
    ['@appsemble/test-gamma', '1.0.0'],
  ].map(([name, version]) => [
    `${name}@${version}`,
    {
      name,
      version,
      // Like real block manifests, the parameter schema declares its dialect and carries its own
      // definitions, which may refer to themselves.
      parameters: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        additionalProperties: false,
        properties: {
          icon: { type: 'string' },
          fields: { type: 'array', items: { $ref: '#/definitions/Field' } },
        },
        definitions: {
          Field: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              fields: { type: 'array', items: { $ref: '#/definitions/Field' } },
            },
          },
        },
      },
    },
  ]),
);

function stubBlockRegistry(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      const match = /\/api\/blocks\/(.+)\/versions\/(.+)$/.exec(decodeURIComponent(String(url)));
      const manifest = match && manifests[`${match[1]}@${match[2]}`];
      return Promise.resolve({
        ok: Boolean(manifest),
        status: manifest ? 200 : 404,
        headers: new Headers(),
        json: () => Promise.resolve(manifest ?? null),
      } as unknown as Response);
    }),
  );
}

interface Block {
  type: string;
  version: string;
  parameters?: string[];
}

/**
 * Render an app definition with one page per block.
 *
 * @param blocks The blocks to put on the pages.
 * @param extra Extra top level lines, placed after `name`.
 * @returns The app definition YAML.
 */
function app(blocks: Block[], extra: string[] = []): string {
  return [
    'name: Test app',
    ...extra,
    'defaultPage: Page 0',
    'pages:',
    ...blocks.flatMap((block, index) => [
      `  - name: Page ${index}`,
      '    blocks:',
      `      - type: ${block.type}`,
      `        version: ${block.version}`,
      ...(block.parameters
        ? ['        parameters:', ...block.parameters.map((p) => `          ${p}`)]
        : []),
    ]),
    '',
  ].join('\n');
}

const alpha = { type: 'test-alpha', version: '1.0.0' };
const alphaNext = { type: 'test-alpha', version: '1.0.1' };
const beta = { type: 'test-beta', version: '1.0.0' };
const gamma = { type: 'test-gamma', version: '1.0.0' };

/**
 * An app definition with one error of each kind only the yaml language service reports through
 * the schema: a block parameter of the wrong type, a property the app schema does not allow, and a
 * duplicate key.
 *
 * @param blocks Further blocks to place after the invalid one.
 * @returns The app definition YAML.
 */
function appWithYamlErrors(blocks: Block[]): string {
  return app(
    [{ ...alpha, parameters: ['icon: 123'] }, ...blocks],
    ['notAnAppProperty: true', 'name: Duplicate'],
  );
}

function yamlServiceMessages(diagnostics: Diagnostic[]): string[] {
  return diagnostics
    .filter((diagnostic) => diagnostic.source)
    .map((diagnostic) => diagnostic.message)
    .sort();
}

const allYamlErrors = expect.arrayContaining([
  expect.stringMatching(/Incorrect type\. Expected "string"/),
  expect.stringMatching(/Property notAnAppProperty is not allowed/),
  expect.stringMatching(/Map keys must be unique/),
]);

interface Client {
  connection: MessageConnection;
  telemetry: TelemetryImpl;
  publishes: { uri: string; diagnostics: Diagnostic[] }[];
  logs: string[];
  open: (text: string) => void;
  change: (text: string) => void;

  /**
   * Wait until the server publishes diagnostics that satisfy the assertion.
   */
  waitForDiagnostics: (assertion: (diagnostics: Diagnostic[]) => void) => Promise<Diagnostic[]>;

  /**
   * Wait until no diagnostics have been published for `quietMs`, returning the latest ones.
   */
  settle: (quietMs?: number) => Promise<Diagnostic[]>;
}

const uri = 'file:///test/app-definition.yaml';

async function startServer(): Promise<Client> {
  const toServer = new PassThrough();
  const toClient = new PassThrough();
  const serverConnection = createConnection(
    new StreamMessageReader(toServer),
    new StreamMessageWriter(toClient),
  );
  const settings = new SettingsState();
  const telemetry = new TelemetryImpl(serverConnection);
  new YAMLServerInit(
    serverConnection,
    settings,
    workspaceContext,
    { handle: () => Promise.reject(new Error('No external schemas in tests')) },
    telemetry,
  ).start();

  const connection = createMessageConnection(
    new StreamMessageReader(toClient),
    new StreamMessageWriter(toServer),
  );
  const publishes: Client['publishes'] = [];
  const logs: string[] = [];
  let lastPublishAt = 0;
  connection.onNotification(
    'textDocument/publishDiagnostics',
    (params: { uri: string; diagnostics: Diagnostic[] }) => {
      publishes.push(params);
      lastPublishAt = Date.now();
    },
  );
  connection.onNotification('window/logMessage', ({ message }: { message: string }) => {
    logs.push(message);
  });
  connection.onRequest('workspace/configuration', ({ items }: { items: unknown[] }) =>
    items.map(() => ({ blockRegistryBaseUrl: 'https://registry.test' })),
  );
  connection.onRequest('client/registerCapability', () => null);
  connection.listen();

  await connection.sendRequest('initialize', {
    processId: null,
    rootUri: 'file:///test',
    capabilities: { workspace: { configuration: true } },
  });
  await connection.sendNotification('initialized', {});

  let version = 1;
  const latest = (): Diagnostic[] => publishes.at(-1)?.diagnostics ?? [];
  return {
    connection,
    telemetry,
    publishes,
    logs,
    open(text) {
      connection.sendNotification('textDocument/didOpen', {
        textDocument: { uri, languageId: 'yaml', version, text },
      });
    },
    change(text) {
      version += 1;
      connection.sendNotification('textDocument/didChange', {
        textDocument: { uri, version },
        contentChanges: [{ text }],
      });
    },
    async waitForDiagnostics(assertion) {
      await vi.waitFor(() => assertion(latest()), { timeout: 20_000, interval: 50 });
      return latest();
    },
    async settle(quietMs = 1000) {
      const since = Date.now();
      await vi.waitFor(
        () => {
          expect(lastPublishAt).toBeGreaterThan(since);
          expect(Date.now() - lastPublishAt).toBeGreaterThan(quietMs);
        },
        { timeout: 20_000, interval: 50 },
      );
      return latest();
    },
  };
}

let client: Client;

beforeEach(async () => {
  stubBlockRegistry();
  client = await startServer();
});

afterEach(() => {
  client.connection.dispose();
  vi.unstubAllGlobals();
});

describe('yaml language service diagnostics across block set changes', () => {
  it('reports schema errors on the first validation', async () => {
    client.open(appWithYamlErrors([]));

    await client.waitForDiagnostics((diagnostics) =>
      expect(yamlServiceMessages(diagnostics)).toStrictEqual(allYamlErrors),
    );
  });

  it('keeps reporting schema errors after a block is added and removed', async () => {
    client.open(app([alpha]));
    await client.settle();

    client.change(app([alpha, beta]));
    await client.settle();
    client.change(app([alpha]));
    await client.settle();
    client.change(appWithYamlErrors([]));

    await client.waitForDiagnostics((diagnostics) =>
      expect(yamlServiceMessages(diagnostics)).toStrictEqual(allYamlErrors),
    );
  });

  it('keeps reporting schema errors after a block version is swapped back and forth', async () => {
    client.open(app([alpha, beta]));
    await client.settle();

    for (const blocks of [
      [alphaNext, beta],
      [alpha, beta],
      [alphaNext, beta],
    ]) {
      client.change(app(blocks));
      await client.settle();
    }
    client.change(appWithYamlErrors([alphaNext, beta]));

    await client.waitForDiagnostics((diagnostics) =>
      expect(yamlServiceMessages(diagnostics)).toStrictEqual(allYamlErrors),
    );
  });

  it('keeps reporting schema errors after the same block set is restored', async () => {
    client.open(appWithYamlErrors([beta]));
    await client.waitForDiagnostics((diagnostics) =>
      expect(yamlServiceMessages(diagnostics)).toStrictEqual(allYamlErrors),
    );

    client.change(app([alpha, beta, gamma]));
    await client.settle();
    client.change(appWithYamlErrors([beta]));

    await client.waitForDiagnostics((diagnostics) =>
      expect(yamlServiceMessages(diagnostics)).toStrictEqual(allYamlErrors),
    );
  });

  it('keeps reporting schema errors after ten block set changes', async () => {
    client.open(app([alpha]));
    await client.settle();

    const sets = [
      [alpha, beta],
      [beta],
      [beta, gamma],
      [alphaNext],
      [alpha, gamma],
      [gamma],
      [alpha, beta, gamma],
      [alphaNext, beta],
      [beta],
      [alpha],
    ];
    for (const blocks of sets) {
      client.change(app(blocks));
      await client.settle();
    }
    client.change(appWithYamlErrors([beta, gamma]));

    await client.waitForDiagnostics((diagnostics) =>
      expect(yamlServiceMessages(diagnostics)).toStrictEqual(allYamlErrors),
    );
  });

  it('keeps reporting schema errors after rapid block set changes', async () => {
    client.open(app([alpha]));
    await client.settle();

    for (const blocks of [[alpha, beta], [gamma], [alphaNext, beta], [beta, gamma], [alpha]]) {
      client.change(app(blocks));
    }
    client.change(appWithYamlErrors([gamma]));

    await client.waitForDiagnostics((diagnostics) =>
      expect(yamlServiceMessages(diagnostics)).toStrictEqual(allYamlErrors),
    );
  });

  it('keeps reporting schema errors when the block set changes while a validation is running', async () => {
    client.open(app([alpha]));
    await client.settle();

    for (const blocks of [[alpha, beta], [gamma], [alphaNext, gamma], [beta]]) {
      client.change(app(blocks));
      // Wait out the debounce so the next edit lands while this edit's validation is running.
      await sleep(250);
    }
    client.change(appWithYamlErrors([beta]));

    await client.waitForDiagnostics((diagnostics) =>
      expect(yamlServiceMessages(diagnostics)).toStrictEqual(allYamlErrors),
    );
  });
});

describe('language service errors', () => {
  it('shows an error the yaml language service reports in the language server output', async () => {
    client.telemetry.sendError(
      'yaml.validation.error',
      new RangeError('Maximum call stack size exceeded'),
    );

    await vi.waitFor(() =>
      expect(client.logs.join('\n')).toMatch(
        /yaml\.validation\.error: RangeError: Maximum call stack size exceeded/,
      ),
    );
  });
});
