import {
  type ClientCapabilities,
  type Disposable,
  TextDocuments,
  type WorkspaceFolder,
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { type URI } from 'vscode-uri';
import { type JSONSchema } from 'yaml-language-server/lib/esm/languageservice/jsonSchema.js';
import { type YamlVersion } from 'yaml-language-server/lib/esm/languageservice/parser/yamlParser07.js';
import { JSON_SCHEMASTORE_URL } from 'yaml-language-server/lib/esm/languageservice/utils/schemaUrls.js';
import {
  type CustomFormatterOptions,
  type SchemaConfiguration,
  type SchemasSettings,
} from 'yaml-language-server/lib/esm/languageservice/yamlLanguageService.js';

import { type ISchemaAssociations } from './requestTypes.js';

// Client settings interface to grab settings relevant for the language server
export interface Settings {
  yaml: {
    format: CustomFormatterOptions;
    schemas: JSONSchemaSettings[];
    // TODO: nvm
    // schemas: Record<string, string>;
    validate: boolean;
    hover: boolean;
    completion: boolean;
    customTags: string[];
    schemaStore: {
      url: string;
      enable: boolean;
    };
    disableDefaultProperties: boolean;
    disableAdditionalProperties: boolean;
    suggest: {
      parentSkeletonSelectedFirst: boolean;
    };
    style: {
      flowMapping: 'allow' | 'forbid';
      flowSequence: 'allow' | 'forbid';
    };
    keyOrdering: boolean;
    maxItemsComputed: number;
    yamlVersion: YamlVersion;
  };
  http: {
    proxy: string;
    proxyStrictSSL: boolean;
  };
  yamlEditor: {
    'editor.tabSize': number;
    'editor.insertSpaces': boolean;
    'editor.formatOnType': boolean;
  };
  vscodeEditor: {
    detectIndentation: boolean;
  };
  files: {
    associations: Map<string, string>;
  };
}

export interface JSONSchemaSettings {
  fileMatch?: string[];
  url?: string;
  schema?: JSONSchema;
}

// This class is responsible for handling all the settings
export class SettingsState {
  yamlConfigurationSettings: JSONSchemaSettings[] = [];
  // TODO: remove
  // yamlConfigurationSettings: Record<string, string> = {};
  // TODO: remove
  // yamlConfigurationSettings: Record<string, JSONSchemaSettings> = {};

  schemaAssociations: ISchemaAssociations | SchemaConfiguration[] | undefined = undefined;

  formatterRegistration: PromiseLike<Disposable> | null = null;

  specificValidatorPaths: string[] = [];

  schemaConfigurationSettings: SchemaConfiguration[] = [];

  yamlShouldValidate = true;

  yamlFormatterSettings = {
    singleQuote: false,
    bracketSpacing: true,
    proseWrap: 'preserve',
    printWidth: 80,
    trailingComma: true,
    enable: true,
  } as CustomFormatterOptions & { trailingComma?: boolean };

  yamlShouldHover = true;

  yamlShouldCompletion = true;

  schemaStoreSettings: SchemasSettings[] = [];

  customTags: string[] = [];

  schemaStoreEnabled = true;

  schemaStoreUrl = JSON_SCHEMASTORE_URL;

  indentation: string | undefined = undefined;

  disableAdditionalProperties = false;

  disableDefaultProperties = false;

  suggest = {
    parentSkeletonSelectedFirst: false,
  };

  style?: {
    flowMapping: 'allow' | 'forbid';
    flowSequence: 'allow' | 'forbid';
  };

  keyOrdering = false;

  maxItemsComputed = 5000;

  // File validation helpers
  pendingValidationRequests: Record<string, NodeJS.Timeout> = {};

  validationDelayMs = 200;

  // Create a simple text document manager. The text document manager
  // supports full document sync only
  documents: TextDocuments<TextDocument> | TextDocumentTestManager = new TextDocuments(
    TextDocument,
  );

  // Language client configuration
  capabilities!: ClientCapabilities;

  workspaceRoot: URI | null = null;

  workspaceFolders: WorkspaceFolder[] = [];

  clientDynamicRegisterSupport = false;

  hierarchicalDocumentSymbolSupport = false;

  hasWorkspaceFolderCapability = false;

  hasConfigurationCapability = false;

  useVSCodeContentRequest = false;

  yamlVersion: YamlVersion = '1.2';

  useSchemaSelectionRequests = false;

  hasWsChangeWatchedFileDynamicRegistration = false;

  fileExtensions: string[] = ['.yml', '.yaml'];
}

export class TextDocumentTestManager extends TextDocuments<TextDocument> {
  testTextDocuments = new Map<string, TextDocument>();

  constructor() {
    super(TextDocument);
  }

  get(uri: string): TextDocument | undefined {
    return this.testTextDocuments.get(uri);
  }

  set(textDocument: TextDocument): void {
    this.testTextDocuments.set(textDocument.uri, textDocument);
  }
}
