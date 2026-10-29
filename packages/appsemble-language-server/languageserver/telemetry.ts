/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import { type Connection } from 'vscode-languageserver';
import {
  type Telemetry,
  type TelemetryEvent,
} from 'yaml-language-server/lib/esm/languageservice/telemetry.js';
import { convertErrorToTelemetryMsg } from 'yaml-language-server/lib/esm/languageservice/utils/objects.js';

export class TelemetryImpl implements Telemetry {
  private readonly connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  send(event: TelemetryEvent): void {
    this.connection.telemetry.logEvent(event);
  }

  sendError(name: string, error: unknown): void {
    this.send({ name, type: 'track', properties: { error: convertErrorToTelemetryMsg(error) } });
  }

  sendTrack(name: string, properties: unknown): void {
    this.send({ name, type: 'track', properties });
  }
}
