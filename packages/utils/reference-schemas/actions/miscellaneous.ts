import { type OpenAPIV3 } from 'openapi-types';

import { AnalyticsActionDefinition } from '../../api/components/schemas/AnalyticsActionDefinition.js';
import { ConditionActionDefinition } from '../../api/components/schemas/ConditionActionDefinition.js';
import { ControllerActionDefinition } from '../../api/components/schemas/ControllerActionDefinition.js';
import { DialogActionDefinition } from '../../api/components/schemas/DialogActionDefinition.js';
import { DialogErrorActionDefinition } from '../../api/components/schemas/DialogErrorActionDefinition.js';
import { DialogOkActionDefinition } from '../../api/components/schemas/DialogOkActionDefinition.js';
import { DownloadActionDefinition } from '../../api/components/schemas/DownloadActionDefinition.js';
import { EachActionDefinition } from '../../api/components/schemas/EachActionDefinition.js';
import { EmailActionDefinition } from '../../api/components/schemas/EmailActionDefinition.js';
import { EventActionDefinition } from '../../api/components/schemas/EventActionDefinition.js';
import { LogActionDefinition } from '../../api/components/schemas/LogActionDefinition.js';
import { MatchActionDefinition } from '../../api/components/schemas/MatchActionDefinition.js';
import { MessageActionDefinition } from '../../api/components/schemas/MessageActionDefinition.js';
import { NoopActionDefinition } from '../../api/components/schemas/NoopActionDefinition.js';
import { NotifyActionDefinition } from '../../api/components/schemas/NotifyActionDefinition.js';
import { RequestActionDefinition } from '../../api/components/schemas/RequestActionDefinition.js';
import { ShareActionDefinition } from '../../api/components/schemas/ShareActionDefinition.js';
import { StaticActionDefinition } from '../../api/components/schemas/StaticActionDefinition.js';
import { ThrowActionDefinition } from '../../api/components/schemas/ThrowActionDefinition.js';

export const miscellaneousActions: Record<string, OpenAPIV3.SchemaObject> = {
  analytics: AnalyticsActionDefinition,
  condition: ConditionActionDefinition,
  controller: ControllerActionDefinition,
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
