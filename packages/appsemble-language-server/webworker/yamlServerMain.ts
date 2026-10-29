/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */
import { RequestType } from 'vscode-languageserver';
import {
  BrowserMessageReader,
  BrowserMessageWriter,
  createConnection,
} from 'vscode-languageserver/browser.js';
import { workspaceContext } from 'yaml-language-server/lib/esm/languageservice/services/schemaRequestHandler.js';

import { TelemetryImpl } from '../languageserver/telemetry.js';
import { DefaultSchemaRequestWrapper } from '../SchemaRequestWrapper.js';
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

const fileSystem = {
  readFile(fsPath: string) {
    return connection.sendRequest(FSReadFile.type, fsPath);
  },
};

const schemaRequestWrapper = new DefaultSchemaRequestWrapper(connection, yamlSettings, fileSystem);

const telemetry = new TelemetryImpl(connection);

new YAMLServerInit(
  connection,
  yamlSettings,
  workspaceContext,
  schemaRequestWrapper,
  telemetry,
).start();
