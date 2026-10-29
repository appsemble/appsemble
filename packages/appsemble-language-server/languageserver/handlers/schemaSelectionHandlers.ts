/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import { type Connection } from 'vscode-languageserver/node.js';
import { type JSONSchema } from 'yaml-language-server/lib/esm/languageservice/jsonSchema.js';
import { yamlDocumentsCache } from 'yaml-language-server/lib/esm/languageservice/parser/yaml-documents.js';
import { type YAMLSchemaService } from 'yaml-language-server/lib/esm/languageservice/services/yamlSchemaService.js';
import { getSchemaUrls } from 'yaml-language-server/lib/esm/languageservice/utils/schemaUrls.js';

import {
  type JSONSchemaDescription,
  type JSONSchemaDescriptionExt,
  SchemaSelectionRequests,
} from '../../requestTypes.js';
import { type SettingsState } from '../../yamlSettings.js';

export class JSONSchemaSelection {
  private readonly schemaService: YAMLSchemaService;

  private readonly yamlSettings?: SettingsState;

  private readonly connection?: Connection;

  constructor(
    schemaService: YAMLSchemaService,
    yamlSettings?: SettingsState,
    connection?: Connection,
  ) {
    this.schemaService = schemaService;
    this.yamlSettings = yamlSettings;
    this.connection = connection;

    this.connection?.onRequest(SchemaSelectionRequests.getSchema, (fileUri) =>
      this.getSchemas(fileUri),
    );
    this.connection?.onRequest(SchemaSelectionRequests.getAllSchemas, (fileUri) =>
      this.getAllSchemas(fileUri),
    );
  }

  async getSchemas(docUri: string): Promise<JSONSchemaDescription[]> {
    const schemas = await this.getSchemasForFile(docUri);
    return Array.from(schemas).map((val) => ({
      name: val[1].title,
      uri: val[0],
      description: val[1].description,
      versions: val[1].versions,
    }));
  }

  async getAllSchemas(docUri: string): Promise<JSONSchemaDescriptionExt[]> {
    const fileSchemas = await this.getSchemasForFile(docUri);
    const fileSchemasHandle: JSONSchemaDescriptionExt[] = Array.from(fileSchemas.entries()).map(
      (val) => ({
        uri: val[0],
        fromStore: false,
        usedForCurrentFile: true,
        name: val[1].title,
        description: val[1].description,
        versions: val[1].versions,
      }),
    );
    const result = [];
    let allSchemas = this.schemaService.getAllSchemas();
    allSchemas = allSchemas.filter((val) => !fileSchemas.has(val.uri));
    result.push(...fileSchemasHandle, ...allSchemas);

    return result;
  }

  private async getSchemasForFile(docUri: string): Promise<Map<string, JSONSchema>> {
    const document = this.yamlSettings?.documents.get(docUri);
    const schemas = new Map<string, JSONSchema>();
    if (!document) {
      return schemas;
    }

    const yamlDoc = yamlDocumentsCache.getYamlDocument(document);

    for (const currentYAMLDoc of yamlDoc.documents) {
      const schema = await this.schemaService.getSchemaForResource(document.uri, currentYAMLDoc);
      if (schema?.schema) {
        const schemaUrls = getSchemaUrls(schema?.schema);
        if (schemaUrls.size === 0) {
          continue;
        }
        for (const urlToSchema of schemaUrls) {
          schemas.set(urlToSchema[0], urlToSchema[1]);
        }
      }
    }
    return schemas;
  }
}
