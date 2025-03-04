import { type Options } from '@appsemble/node-utils';
import { type ActionDefinition } from '@appsemble/types';
import { type RemapperContext, type ServerActionName } from '@appsemble/utils';
import { type DefaultContext, type DefaultState, type ParameterizedContext } from 'koa';

import { condition } from './condition.js';
import { each } from './each.js';
import { email } from './email.js';
import { log } from './log.js';
import { noop } from './noop.js';
import { notify } from './notify.js';
import { request } from './request.js';
import * as resource from './resource.js';
import { staticAction } from './static.js';
import { throwAction } from './throw.js';
import { type App } from '../../models/index.js';
import { type Mailer } from '../email/Mailer.js';

export interface ServerActionParameters<T extends ActionDefinition = ActionDefinition> {
  app: App;
  action: T;
  mailer: Mailer;
  data: unknown;
  internalContext?: RemapperContext;
  options: Options;
  context: ParameterizedContext<DefaultState, DefaultContext, any>;
}

export const actions = {
  analytics: noop,
  condition,
  controller: noop,
  dialog: noop,
  'dialog.error': noop,
  'dialog.ok': noop,
  download: noop,
  each,
  email,
  event: noop,
  'flow.back': noop,
  'flow.cancel': noop,
  'flow.finish': noop,
  'flow.next': noop,
  'flow.to': noop,
  link: noop,
  'link.back': noop,
  'link.next': noop,
  log,
  message: noop,
  match: noop,
  noop,
  notify,
  request,
  'resource.create': resource.create,
  'resource.delete': resource.remove,
  'resource.delete.all': resource.removeAll,
  'resource.delete.bulk': resource.removeBulk,
  'resource.get': resource.get,
  'resource.history.get': noop,
  'resource.query': resource.query,
  'resource.update': resource.update,
  'resource.update.positions': noop,
  'resource.patch': resource.patch,
  'resource.count': noop,
  'resource.subscription.status': noop,
  'resource.subscription.subscribe': noop,
  'resource.subscription.toggle': noop,
  'resource.subscription.unsubscribe': noop,
  share: noop,
  static: staticAction,
  'storage.read': noop,
  'storage.write': noop,
  'storage.append': noop,
  'storage.subtract': noop,
  'storage.update': noop,
  'storage.delete': noop,
  'group.member.invite': noop,
  'group.member.delete': noop,
  'group.member.role.update': noop,
  'group.member.query': noop,
  'group.query': noop,
  throw: throwAction,
  'app.member.register': noop,
  'app.member.invite': noop,
  'app.member.login': noop,
  'app.member.logout': noop,
  'app.member.role.update': noop,
  'app.member.properties.patch': noop,
  'app.member.current.patch': noop,
  'app.member.delete': noop,
  'app.member.query': noop,
};

// https://stackoverflow.com/a/53808212
type IfEquals<T, U, Y = unknown, N = never> =
  (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2 ? Y : N;

// A `Record<string, string | never>` of actions that accept a type more narrow than
// `ServerActionParameters<ActionDefinition>`. (so
// not `noop`)
type NonNoopActions = {
  [K in keyof typeof actions]: Parameters<(typeof actions)[K]>[0] extends ServerActionParameters<
    infer T
  >
    ? IfEquals<T, ActionDefinition, never, K>
    : never;
};

// The `request` action is a special case for now
type ActualServerActionName = NonNoopActions[keyof NonNoopActions] | 'noop' | 'request';

// This line checks if the `serverActions` set contains all the actions defined in the `actions` object.
// This is not done in the `utils` package, as this would create a circular dependency (server -> utils -> server).
// If the contents of `serverActions` and the non-`noop` keys of `actions` are equal, the type is `true`, otherwise it's `never`.
type ServerActionsAreValid = IfEquals<ServerActionName, ActualServerActionName, true, never>;
// If this line breaks, go fix `packages/utils/serverActions.ts`
true satisfies ServerActionsAreValid;
// If this line breaks, an action in `packages/utils/serverActions.ts` isn't defined in `actions` or is `noop`.
'' as ServerActionName satisfies ActualServerActionName;
// If this line breaks, an action defined in this file is missing from `packages/utils/serverActions.ts`
'' as ActualServerActionName satisfies ServerActionName;
