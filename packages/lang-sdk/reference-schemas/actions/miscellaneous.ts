import { type OpenAPIV3 } from 'openapi-types';

import { AnalyticsActionDefinition } from '../../schemas/AnalyticsActionDefinition.js';
import { ConditionActionDefinition } from '../../schemas/ConditionActionDefinition.js';
import { ControllerActionDefinition } from '../../schemas/ControllerActionDefinition.js';
import { CsvParseActionDefinition } from '../../schemas/CsvParseActionDefinition.js';
import { DialogActionDefinition } from '../../schemas/DialogActionDefinition.js';
import { DialogErrorActionDefinition } from '../../schemas/DialogErrorActionDefinition.js';
import { DialogOkActionDefinition } from '../../schemas/DialogOkActionDefinition.js';
import { DownloadActionDefinition } from '../../schemas/DownloadActionDefinition.js';
import { EachActionDefinition } from '../../schemas/EachActionDefinition.js';
import { EmailActionDefinition } from '../../schemas/EmailActionDefinition.js';
import { EventActionDefinition } from '../../schemas/EventActionDefinition.js';
import { LogActionDefinition } from '../../schemas/LogActionDefinition.js';
import { MatchActionDefinition } from '../../schemas/MatchActionDefinition.js';
import { MessageActionDefinition } from '../../schemas/MessageActionDefinition.js';
import { NoopActionDefinition } from '../../schemas/NoopActionDefinition.js';
import { NotifyActionDefinition } from '../../schemas/NotifyActionDefinition.js';
import { RequestActionDefinition } from '../../schemas/RequestActionDefinition.js';
import { ShareActionDefinition } from '../../schemas/ShareActionDefinition.js';
import { StaticActionDefinition } from '../../schemas/StaticActionDefinition.js';
import { ThrowActionDefinition } from '../../schemas/ThrowActionDefinition.js';

export const miscellaneousActions: Record<string, OpenAPIV3.SchemaObject> = {
  analytics: AnalyticsActionDefinition,
  condition: ConditionActionDefinition,
  controller: ControllerActionDefinition,
  'csv.parse': CsvParseActionDefinition,
  download: DownloadActionDefinition,
  dialog: DialogActionDefinition,
  'dialog.ok': DialogOkActionDefinition,
  'dialog.error': DialogErrorActionDefinition,
  each: EachActionDefinition,
  event: EventActionDefinition,
  email: EmailActionDefinition,
  log: LogActionDefinition,
  match: MatchActionDefinition,
  message: MessageActionDefinition,
  noop: NoopActionDefinition,
  notify: NotifyActionDefinition,
  request: RequestActionDefinition,
  share: ShareActionDefinition,
  static: StaticActionDefinition,
  throw: ThrowActionDefinition,
};
