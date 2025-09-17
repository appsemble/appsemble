/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */
import { type Connection, RequestType } from 'vscode-languageserver';
import {
  BrowserMessageReader,
  BrowserMessageWriter,
  createConnection,
} from 'vscode-languageserver/browser.js';
import {
  schemaRequestHandler,
  workspaceContext,
} from 'yaml-language-server/lib/esm/languageservice/services/schemaRequestHandler.js';

import { createAppsembleSchemaConfig } from '../appsembleSchemaConfig.js';
import { TelemetryImpl } from '../languageserver/telemetry.js';
import { YAMLServerInit } from '../yamlServerInit.js';
import { SettingsState } from '../yamlSettings.js';

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace FSReadFile {
  export const type = new RequestType<string, string, unknown>('fs/readFile');
}

const messageReader = new BrowserMessageReader(globalThis);
const messageWriter = new BrowserMessageWriter(globalThis);

const connection = createConnection(messageReader, messageWriter);

const yamlSettings = new SettingsState();
yamlSettings.schemaConfigurationSettings = [
  createAppsembleSchemaConfig({ referenceUri: 'https://appsemble.app/en/docs/reference' }),
];
yamlSettings.schemaStoreEnabled = false;

const fileSystem = {
  readFile(fsPath: string) {
    return connection.sendRequest(FSReadFile.type, fsPath);
  },
};

/**
 * Handles schema content requests given the schema URI
 *
 * @param conn is the LSP connection
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

// eslint-disable-next-line @typescript-eslint/no-invalid-this
const schemaRequestService = schemaRequestHandlerWrapper.bind(this, connection);
const telemetry = new TelemetryImpl(connection);

new YAMLServerInit(
  connection,
  yamlSettings,
  workspaceContext,
  schemaRequestService,
  telemetry,
).start();
