/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Copyright (c) Adam Voss. All rights reserved.
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import { readFile } from 'node:fs/promises';

import { schemas } from '@appsemble/lang-sdk';
import { type Schema } from 'jsonschema';
import { type Connection, createConnection, ProposedFeatures } from 'vscode-languageserver/node.js';
import { type JSONSchema } from 'yaml-language-server/lib/esm/languageservice/jsonSchema.js';
import {
  schemaRequestHandler,
  workspaceContext,
} from 'yaml-language-server/lib/esm/languageservice/services/schemaRequestHandler.js';
import { convertErrorToTelemetryMsg } from 'yaml-language-server/lib/esm/languageservice/utils/objects.js';

import { TelemetryImpl } from './languageserver/telemetry.js';
import { YAMLServerInit } from './yamlServerInit.js';
import { SettingsState } from './yamlSettings.js';

// Create a connection for the server.

const connection = process.argv.includes('--stdio')
  ? createConnection()
  : createConnection(ProposedFeatures.all);

process.on('uncaughtException', (err: Error) => {
  // Send all uncaught exception to telemetry with stack traces
  connection.console.error(convertErrorToTelemetryMsg(err));
});

console.log = connection.console.log.bind(connection.console);
console.error = connection.console.error.bind(connection.console);

// Vscode-nls calls console.error(null) in some cases, so we put that in info, to predict sending "null" in to telemetry
console.error = (arg) => {
  if (arg == null) {
    connection.console.info(arg);
  } else {
    connection.console.error(arg);
  }
};

function mapValues<T, U>(record: Record<string, T>, fn: (value: T) => U): Record<string, U> {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, fn(value)]));
}

/**
 * Create a deep clone of a JSON schema with `markdownDescriptions` set to the description.
 *
 * @param schema The schema to process.
 * @returns The schema with a markdown description.
 */
function addMarkdownDescriptions(schema: Schema): Schema {
  const result = { ...schema } as Schema & { markdownDescription?: string };
  if (result.properties) {
    result.properties = mapValues(result.properties, addMarkdownDescriptions);
  }
  if (result.patternProperties) {
    result.patternProperties = mapValues(result.patternProperties, addMarkdownDescriptions);
  }
  if (typeof result.additionalProperties === 'object') {
    result.additionalProperties = addMarkdownDescriptions(result.additionalProperties);
  }
  if (Array.isArray(result.items)) {
    result.items = result.items.map(addMarkdownDescriptions);
  }
  result.markdownDescription = result.description;
  return result;
}

const yamlSettings = new SettingsState();
// YamlSettings.yamlConfigurationSettings = [
//   {
//     url: 'appsemble://schema.json',
//     fileMatch: ['app-definition.yaml'],
//     schema: {
//       $ref: '#/components/schemas/AppDefinition',
//       components: {
//         schemas: mapValues(schemas, addMarkdownDescriptions),
//       },
//     } as JSONSchema,
//   },
// ];
yamlSettings.schemaConfigurationSettings = [
  {
    uri: 'appsemble://schema.json',
    fileMatch: ['app-definition.yaml'],
    schema: {
      $ref: '#/components/schemas/AppDefinition',
      components: {
        schemas: mapValues(schemas, addMarkdownDescriptions),
      },
    } as JSONSchema,
  },
];
yamlSettings.schemaStoreEnabled = false;

const fileSystem = {
  async readFile(fsPath: string, encoding?: string) {
    const b = await readFile(fsPath, encoding as BufferEncoding);
    return String(b.toString);
  },
};

/**
 * Handles schema content requests given the schema URI
 *
 * @param conn the connection to use for the request
 * @param uri can be a local file, vscode request, http(s) request or a custom request
 */
const schemaRequestHandlerWrapper = (conn: Connection, uri: string): Promise<string> =>
  schemaRequestHandler(
    conn,
    uri,
    yamlSettings.workspaceFolders,
    yamlSettings.workspaceRoot!,
    yamlSettings.useVSCodeContentRequest,
    fileSystem,
  );

const schemaRequestService = schemaRequestHandlerWrapper.bind(null, connection);
const telemetry = new TelemetryImpl(connection);

new YAMLServerInit(
  connection,
  yamlSettings,
  workspaceContext,
  schemaRequestService,
  telemetry,
).start();
