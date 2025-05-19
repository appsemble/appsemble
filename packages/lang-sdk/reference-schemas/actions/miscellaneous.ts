import { type OpenAPIV3 } from 'openapi-types';

import { AnalyticsActionDefinition } from '../../schemas/actions/AnalyticsActionDefinition.js';
import { ConditionActionDefinition } from '../../schemas/actions/ConditionActionDefinition.js';
import { ControllerActionDefinition } from '../../schemas/actions/ControllerActionDefinition.js';
import { CsvParseActionDefinition } from '../../schemas/actions/CsvParseActionDefinition.js';
import { DialogActionDefinition } from '../../schemas/actions/DialogActionDefinition.js';
import { DialogErrorActionDefinition } from '../../schemas/actions/DialogErrorActionDefinition.js';
import { DialogOkActionDefinition } from '../../schemas/actions/DialogOkActionDefinition.js';
import { DownloadActionDefinition } from '../../schemas/actions/DownloadActionDefinition.js';
import { EachActionDefinition } from '../../schemas/actions/EachActionDefinition.js';
import { EmailActionDefinition } from '../../schemas/actions/EmailActionDefinition.js';
import { EventActionDefinition } from '../../schemas/actions/EventActionDefinition.js';
import { LogActionDefinition } from '../../schemas/actions/LogActionDefinition.js';
import { MatchActionDefinition } from '../../schemas/actions/MatchActionDefinition.js';
import { MessageActionDefinition } from '../../schemas/actions/MessageActionDefinition.js';
import { NoopActionDefinition } from '../../schemas/actions/NoopActionDefinition.js';
import { NotifyActionDefinition } from '../../schemas/actions/NotifyActionDefinition.js';
import { RequestActionDefinition } from '../../schemas/actions/RequestActionDefinition.js';
import { ShareActionDefinition } from '../../schemas/actions/ShareActionDefinition.js';
import { StaticActionDefinition } from '../../schemas/actions/StaticActionDefinition.js';
import { ThrowActionDefinition } from '../../schemas/actions/ThrowActionDefinition.js';

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
