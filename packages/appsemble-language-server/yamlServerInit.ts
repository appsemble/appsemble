import { access as fsAccess } from 'node:fs/promises';
import { dirname, join as joinPath } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as l10n from '@vscode/l10n';
import {
  type Connection,
  type InitializeParams,
  type InitializeResult,
  TextDocumentSyncKind,
} from 'vscode-languageserver';
import { URI } from 'vscode-uri';
import { registerCommands } from 'yaml-language-server/lib/esm/languageservice/services/yamlCommands.js';
import { type Telemetry } from 'yaml-language-server/lib/esm/languageservice/telemetry.js';
import { workspaceFoldersChanged } from 'yaml-language-server/lib/esm/languageservice/utils/paths.js';
import {
  getLanguageService as getCustomLanguageService,
  type LanguageService,
  type SchemaRequestService,
  type WorkspaceContextService,
} from 'yaml-language-server/lib/esm/languageservice/yamlLanguageService.js';

import { YamlCommands } from './commands.js';
import { commandExecutor } from './languageserver/commandExecutor.js';
import { LanguageHandlers } from './languageserver/handlers/languageHandlers.js';
import { NotificationHandlers } from './languageserver/handlers/notificationHandlers.js';
import { RequestHandlers } from './languageserver/handlers/requestHandlers.js';
import { SettingsHandler } from './languageserver/handlers/settingsHandlers.js';
import { ValidationHandler } from './languageserver/handlers/validationHandlers.js';
import { WorkspaceHandlers } from './languageserver/handlers/workspaceHandlers.js';
import { type SettingsState } from './yamlSettings.js';

async function exists(filePath: string): Promise<boolean> {
  // A replacement for fs.existsSync that works with promises
  try {
    await fsAccess(filePath);
    return true;
  } catch {
    return false;
  }
}

export class YAMLServerInit {
  languageService!: LanguageService;

  languageHandler!: LanguageHandlers;

  validationHandler!: ValidationHandler;

  settingsHandler!: SettingsHandler;

  private readonly connection: Connection;

  private yamlSettings: SettingsState;

  private workspaceContext: WorkspaceContextService;

  private schemaRequestService: SchemaRequestService;

  private telemetry: Telemetry;

  constructor(
    connection: Connection,
    yamlSettings: SettingsState,
    workspaceContext: WorkspaceContextService,
    schemaRequestService: SchemaRequestService,
    telemetry: Telemetry,
  ) {
    this.connection = connection;
    this.yamlSettings = yamlSettings;
    this.workspaceContext = workspaceContext;
    this.schemaRequestService = schemaRequestService;
    this.telemetry = telemetry;

    this.yamlSettings.documents.listen(this.connection);

    /**
     * Run when the client connects to the server after it is activated.
     * The server receives the root path(s) of the workspace and the client capabilities.
     */
    this.connection.onInitialize(
      (params: InitializeParams): Promise<InitializeResult> => this.connectionInitialized(params),
    );

    this.connection.onInitialized(() => {
      if (this.yamlSettings.hasWsChangeWatchedFileDynamicRegistration) {
        this.connection.workspace.onDidChangeWorkspaceFolders((changedFolders) => {
          this.yamlSettings.workspaceFolders = workspaceFoldersChanged(
            this.yamlSettings.workspaceFolders,
            changedFolders,
          );
        });
      }
      // Need to call this after connection initialized
      this.settingsHandler.registerHandlers();
      this.settingsHandler.pullConfiguration();
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async setupLocalizationBundle(params: InitializeParams): Promise<void> {
    const filename = fileURLToPath(import.meta.url);
    const dir = dirname(filename);
    const l10nPath: string =
      params.initializationOptions?.l10nPath || joinPath(dir, '../../../l10n');
    const locale: string = params.locale || 'en';
    if (l10nPath) {
      const bundleFile = (await exists(joinPath(l10nPath, `bundle.l10n.${locale}.json`)))
        ? `bundle.l10n.${locale}.json`
        : 'bundle.l10n.json';
      const baseBundleFile = joinPath(l10nPath, bundleFile);
      process.env.VSCODE_NLS_CONFIG = JSON.stringify({
        locale,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _languagePackSupport: true,
      });
      await l10n.config({
        uri: String(URI.file(baseBundleFile)),
      });
    }
  }

  // Public for test setup
  // eslint-disable-next-line require-await
  async connectionInitialized(params: InitializeParams): Promise<InitializeResult> {
    this.yamlSettings.capabilities = params.capabilities;
    this.languageService = getCustomLanguageService({
      schemaRequestService: this.schemaRequestService,
      workspaceContext: this.workspaceContext,
      connection: this.connection,
      yamlSettings: this.yamlSettings as SettingsState & {
        formatterRegistration: NonNullable<SettingsState['formatterRegistration']>;
        style: NonNullable<SettingsState['style']>;
        workspaceRoot: NonNullable<SettingsState['workspaceRoot']>;
        // TODO: nvm
        // yamlConfigurationSettings: any[];
      },
      telemetry: this.telemetry,
      clientCapabilities: params.capabilities,
    });

    // TODO: rm
    // this.languageService.configure(this.yamlSettings);
    // TODO: uncomment or replace
    // this.languageService.configure({
    //   schemas: this.yamlSettings.schemaStoreSettings,
    // });
    // TODO: or this one
    // this.connection.console.log('Pulling config');
    // this.settingsHandler.pullConfiguration();
    // this.connection.console.log('Pulled config');

    // Only try to parse the workspace root if its not null. Otherwise initialize will fail
    if (params.rootUri) {
      this.yamlSettings.workspaceRoot = URI.parse(params.rootUri);
    }
    this.yamlSettings.workspaceFolders = params.workspaceFolders || [];

    this.yamlSettings.hierarchicalDocumentSymbolSupport = Boolean(
      this.yamlSettings.capabilities.textDocument &&
        this.yamlSettings.capabilities.textDocument.documentSymbol &&
        this.yamlSettings.capabilities.textDocument.documentSymbol
          .hierarchicalDocumentSymbolSupport,
    );
    this.yamlSettings.clientDynamicRegisterSupport = Boolean(
      this.yamlSettings.capabilities.textDocument &&
        this.yamlSettings.capabilities.textDocument.formatting &&
        this.yamlSettings.capabilities.textDocument.formatting.dynamicRegistration,
    );
    this.yamlSettings.hasWorkspaceFolderCapability = Boolean(
      this.yamlSettings.capabilities.workspace &&
        Boolean(this.yamlSettings.capabilities.workspace.workspaceFolders),
    );

    this.yamlSettings.hasConfigurationCapability = Boolean(
      this.yamlSettings.capabilities.workspace &&
        Boolean(this.yamlSettings.capabilities.workspace.configuration),
    );

    this.yamlSettings.hasWsChangeWatchedFileDynamicRegistration = Boolean(
      this.yamlSettings.capabilities.workspace &&
        this.yamlSettings.capabilities.workspace.didChangeWatchedFiles &&
        this.yamlSettings.capabilities.workspace.didChangeWatchedFiles.dynamicRegistration,
    );
    this.registerHandlers();
    registerCommands(
      commandExecutor as unknown as Parameters<typeof registerCommands>[0],
      this.connection,
    );
    // TODO: ignore
    // await this.setupl10nBundle(params);
    return {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        completionProvider: { resolveProvider: false },
        hoverProvider: true,
        documentSymbolProvider: true,
        documentFormattingProvider: !this.yamlSettings.clientDynamicRegisterSupport,
        documentOnTypeFormattingProvider: {
          firstTriggerCharacter: '\n',
        },
        documentRangeFormattingProvider: false,
        definitionProvider: true,
        documentLinkProvider: {},
        foldingRangeProvider: true,
        selectionRangeProvider: true,
        codeActionProvider: true,
        codeLensProvider: {
          resolveProvider: false,
        },
        executeCommandProvider: {
          commands: Object.keys(YamlCommands).map(
            (k) => YamlCommands[k as keyof typeof YamlCommands],
          ),
        },
        workspace: {
          workspaceFolders: {
            changeNotifications: true,
            supported: true,
          },
        },
      },
    };
  }

  start(): void {
    this.connection.listen();
  }

  private registerHandlers(): void {
    // Register all features that the language server has
    this.validationHandler = new ValidationHandler(
      this.connection,
      this.languageService,
      this.yamlSettings,
    );
    this.settingsHandler = new SettingsHandler(
      this.connection,
      this.languageService,
      this.yamlSettings,
      this.validationHandler,
      this.telemetry,
    );
    this.settingsHandler.registerHandlers();
    this.languageHandler = new LanguageHandlers(
      this.connection,
      this.languageService,
      this.yamlSettings,
      this.validationHandler,
    );
    this.languageHandler.registerHandlers();
    new NotificationHandlers(
      this.connection,
      this.languageService,
      this.yamlSettings,
      this.settingsHandler,
    ).registerHandlers();
    new RequestHandlers(this.connection, this.languageService).registerHandlers();
    new WorkspaceHandlers(this.connection, commandExecutor).registerHandlers();
  }
}
