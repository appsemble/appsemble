import { type Connection } from 'vscode-languageserver';
import { type SchemaRequestService } from 'yaml-language-server';
import {
  type FileSystem,
  schemaRequestHandler,
} from 'yaml-language-server/lib/esm/languageservice/services/schemaRequestHandler.js';

import { type Logger } from './Logger.js';
import { type SettingsState } from './yamlSettings.js';

export interface SchemaRequestWrapper {
  handle: SchemaRequestService;
}

export interface SchemaRequestChainHandler {
  handle: (uri: string) => Promise<string | null>;
}

export class SchemaRequestChainOfResponsibility implements SchemaRequestWrapper {
  private readonly handlers: SchemaRequestChainHandler[];

  private readonly logger: Logger;

  constructor(handlers: SchemaRequestChainHandler[], logger: Logger) {
    this.handlers = handlers;
    this.logger = logger;
  }

  async handle(uri: string): Promise<string> {
    this.logger.log(`CoR Schema request for ${uri}`);
    for (const handler of this.handlers) {
      try {
        const result = await handler.handle(uri);
        if (result) {
          return result;
        }
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error(`Error in schema request handler: ${error.message}\n${error.stack}`);
        }
      }
    }
    return '';
  }
}

export class DefaultSchemaRequestWrapper implements SchemaRequestWrapper {
  private connection: Connection;

  private yamlSettings: SettingsState;

  private fileSystem: FileSystem;

  constructor(connection: Connection, yamlSettings: SettingsState, fileSystem: FileSystem) {
    this.connection = connection;
    this.yamlSettings = yamlSettings;
    this.fileSystem = fileSystem;
  }

  handle(uri: string): Promise<string> {
    return schemaRequestHandler(
      this.connection,
      uri,
      this.yamlSettings.workspaceFolders,
      this.yamlSettings.workspaceRoot!,
      this.yamlSettings.useVSCodeContentRequest,
      this.fileSystem,
    );
  }
}
