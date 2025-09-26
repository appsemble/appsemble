#!/usr/bin/env node
/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Copyright (c) Adam Voss. All rights reserved.
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import { readFile } from 'node:fs/promises';

import { createConnection, ProposedFeatures } from 'vscode-languageserver/node.js';
import { workspaceContext } from 'yaml-language-server/lib/esm/languageservice/services/schemaRequestHandler.js';
import { convertErrorToTelemetryMsg } from 'yaml-language-server/lib/esm/languageservice/utils/objects.js';

import { TelemetryImpl } from './languageserver/telemetry.js';
import { DefaultSchemaRequestWrapper } from './SchemaRequestWrapper.js';
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

const yamlSettings = new SettingsState();
yamlSettings.schemaStoreEnabled = true;

const fileSystem = {
  async readFile(fsPath: string, encoding?: string) {
    const b = await readFile(fsPath, encoding as BufferEncoding);
    return String(b.toString);
  },
};

const schemaRequestWrapper = new DefaultSchemaRequestWrapper(connection, yamlSettings, fileSystem);

const telemetry = new TelemetryImpl(connection);

connection.console.log('Starting Appsemble language server');

new YAMLServerInit(
  connection,
  yamlSettings,
  workspaceContext,
  schemaRequestWrapper,
  telemetry,
).start();
