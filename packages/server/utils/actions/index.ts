import { type ActionDefinition } from '@appsemble/types';
import { type RemapperContext } from '@appsemble/utils';

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
import { type App, type User } from '../../models/index.js';
import { type Mailer } from '../email/Mailer.js';

export interface ServerActionParameters<T extends ActionDefinition = ActionDefinition> {
  app: App;
  action: T;
  user: User;
  mailer: Mailer;
  data: unknown;
  internalContext?: RemapperContext;
}

export const actions = {
  analytics: noop,
  condition,
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
  'resource.get': resource.get,
  'resource.query': resource.query,
  'resource.update': resource.update,
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
  'team.invite': noop,
  'team.join': noop,
  'team.list': noop,
  'team.members': noop,
  throw: throwAction,
  'user.register': noop,
  'user.login': noop,
  'user.update': noop,
};
