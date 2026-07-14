import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

import * as vscode from 'vscode';
import {
  LanguageClient,
  type LanguageClientOptions,
  type ServerOptions,
} from 'vscode-languageclient/node';

let client: LanguageClient | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const repoRoot = resolve(context.extensionPath, '../..');
  const serverModule = join(repoRoot, 'packages/appsemble-language-server/build/server.js');

  if (!existsSync(serverModule)) {
    const action = 'Build server';
    const selected = await vscode.window.showWarningMessage(
      `Appsemble language server build output is missing at ${serverModule}.`,
      action,
    );
    if (selected === action) {
      const terminal = vscode.window.createTerminal('Appsemble language server build');
      terminal.sendText('npm --workspace @appsemble/appsemble-language-server run build');
      terminal.show();
    }
    return;
  }

  const outputChannel = vscode.window.createOutputChannel('Appsemble Language Server');
  context.subscriptions.push(outputChannel);

  const serverOptions: ServerOptions = {
    run: {
      command: process.execPath,
      args: [serverModule, '--stdio'],
      options: { cwd: repoRoot },
    },
    debug: {
      command: process.execPath,
      args: ['--inspect=0', serverModule, '--stdio'],
      options: { cwd: repoRoot },
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: 'file', language: 'yaml', pattern: '**/app-definition.yaml' },
      { scheme: 'file', language: 'yaml', pattern: '**/app-definition.yml' },
    ],
    initializationOptions: {
      appsemble: {
        skipExecuteCommandProvider: true,
      },
    },
    outputChannel,
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('**/app-definition.{yaml,yml}'),
    },
  };

  client = new LanguageClient(
    'appsembleLanguageServer',
    'Appsemble Language Server',
    serverOptions,
    clientOptions,
  );

  context.subscriptions.push(client);
  await client.start();
}

export async function deactivate(): Promise<void> {
  if (client) {
    await client.stop();
    client = undefined;
  }
}
