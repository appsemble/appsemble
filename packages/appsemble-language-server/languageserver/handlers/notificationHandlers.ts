/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */
import { type Connection } from 'vscode-languageserver';
import { type CustomSchemaProvider } from 'yaml-language-server/lib/esm/languageservice/services/yamlSchemaService.js';
import {
  type LanguageService,
  type SchemaConfiguration,
} from 'yaml-language-server/lib/esm/languageservice/yamlLanguageService.js';

import { type SettingsHandler } from './settingsHandlers.js';
import {
  CustomSchemaRequest,
  DynamicCustomSchemaRequestRegistration,
  SchemaAssociationNotification,
  SchemaSelectionRequests,
  VSCodeContentRequestRegistration,
} from '../../requestTypes.js';
import { type SettingsState } from '../../yamlSettings.js';

export class NotificationHandlers {
  private languageService: LanguageService;

  private yamlSettings: SettingsState;

  private settingsHandler: SettingsHandler;

  private readonly connection: Connection;

  constructor(
    connection: Connection,
    languageService: LanguageService,
    yamlSettings: SettingsState,
    settingsHandler: SettingsHandler,
  ) {
    this.connection = connection;
    this.languageService = languageService;
    this.yamlSettings = yamlSettings;
    this.settingsHandler = settingsHandler;
  }

  registerHandlers(): void {
    this.connection.onNotification(SchemaAssociationNotification.type, (associations) =>
      this.schemaAssociationNotificationHandler(associations),
    );
    this.connection.onNotification(DynamicCustomSchemaRequestRegistration.type, () =>
      this.dynamicSchemaRequestHandler(),
    );
    this.connection.onNotification(VSCodeContentRequestRegistration.type, () =>
      this.vscodeContentRequestHandler(),
    );
    this.connection.onNotification(SchemaSelectionRequests.type, () =>
      this.schemaSelectionRequestHandler(),
    );
  }

  /**
   * Received a notification from the client with schema associations from other extensions
   * Update the associations in the server
   *
   * @param associations {Record<string, string[]> | SchemaConfiguration[]}
   */
  private schemaAssociationNotificationHandler(
    associations: Record<string, string[]> | SchemaConfiguration[],
  ): void {
    this.yamlSettings.schemaAssociations = associations;
    this.yamlSettings.specificValidatorPaths = [];
    this.settingsHandler.pullConfiguration().catch((error) => this.connection.console.error(error));
  }

  /**
   * Received a notification from the client that it can accept custom schema requests
   * Register the custom schema provider and use it for requests of unknown scheme
   */
  private dynamicSchemaRequestHandler(): void {
    const schemaProvider = ((resource) =>
      this.connection.sendRequest(CustomSchemaRequest.type, resource)) as CustomSchemaProvider;
    this.languageService.registerCustomSchemaProvider(schemaProvider);
  }

  /**
   * Received a notification from the client that it can accept content requests
   * This means that the server sends schemas back to the client side to get resolved rather
   * than resolving them on the extension side
   */
  private vscodeContentRequestHandler(): void {
    this.yamlSettings.useVSCodeContentRequest = true;
  }

  private schemaSelectionRequestHandler(): void {
    this.yamlSettings.useSchemaSelectionRequests = true;
  }
}
