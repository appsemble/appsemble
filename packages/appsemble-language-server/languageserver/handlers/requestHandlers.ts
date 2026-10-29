/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */
import { type Connection } from 'vscode-languageserver';
import {
  MODIFICATION_ACTIONS,
  type SchemaAdditions,
  type SchemaDeletions,
  type SchemaDeletionsAll,
} from 'yaml-language-server/lib/esm/languageservice/services/yamlSchemaService.js';
import { type LanguageService } from 'yaml-language-server/lib/esm/languageservice/yamlLanguageService.js';

import { SchemaModificationNotification } from '../../requestTypes.js';

export class RequestHandlers {
  private languageService: LanguageService;

  private readonly connection: Connection;

  constructor(connection: Connection, languageService: LanguageService) {
    this.connection = connection;
    this.languageService = languageService;
  }

  registerHandlers(): void {
    this.connection.onRequest(SchemaModificationNotification.type, (modifications) =>
      this.registerSchemaModificationNotificationHandler(modifications),
    );
  }

  private registerSchemaModificationNotificationHandler(
    modifications: SchemaAdditions | SchemaDeletions | SchemaDeletionsAll,
  ): void {
    if (modifications.action === MODIFICATION_ACTIONS.add) {
      this.languageService.modifySchemaContent(modifications);
    } else if (modifications.action === MODIFICATION_ACTIONS.delete) {
      this.languageService.deleteSchemaContent(modifications);
    } else if (modifications.action === MODIFICATION_ACTIONS.deleteAll) {
      this.languageService.deleteSchemasWhole(modifications);
    }
  }
}
