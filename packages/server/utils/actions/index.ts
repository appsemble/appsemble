import { ActionDefinition } from '@appsemble/types';
import { RemapperContext } from '@appsemble/utils';

import { App, User } from '../../models/index.js';
import { Mailer } from '../email/Mailer.js';
import { condition } from './condition.js';
import { each } from './each.js';
import { email } from './email.js';
import { log } from './log.js';
import { noop } from './noop.js';
import { notify } from './notify.js';
import { request } from './request.js';
import { staticAction } from './static.js';
import { throwAction } from './throw.js';

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
  'resource.create': request,
  'resource.delete': request,
  'resource.get': request,
  'resource.query': request,
  'resource.update': request,
  'resource.patch': noop,
  'resource.count': request,
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
  throw: throwAction,
  'user.register': noop,
  'user.login': noop,
  'user.update': noop,
};
