/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import { type Connection, type ExecuteCommandParams } from 'vscode-languageserver';

import { type CommandExecutor } from '../commandExecutor.js';

export class WorkspaceHandlers {
  private readonly connection: Connection;

  private readonly commandExecutor: CommandExecutor;

  constructor(connection: Connection, commandExecutor: CommandExecutor) {
    this.connection = connection;
    this.commandExecutor = commandExecutor;
  }

  registerHandlers(): void {
    this.connection.onExecuteCommand((params) => this.executeCommand(params));
  }

  private executeCommand(params: ExecuteCommandParams): void {
    return this.commandExecutor.executeCommand(params);
  }
}
