import { ActionDefinition } from '@appsemble/types';

import { App, User } from '../../models';
import { Mailer } from '../email/Mailer';
import { condition } from './condition';
import { email } from './email';
import { noop } from './noop';
import { request } from './request';
import { staticAction } from './static';
import { throwAction } from './throw';

export interface ServerActionParameters<T extends ActionDefinition = ActionDefinition> {
  app: App;
  action: T;
  user: User;
  mailer: Mailer;
  data: unknown;
}

export const actions = {
  condition,
  dialog: noop,
  'dialog.error': noop,
  'dialog.ok': noop,
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
  log: noop,
  message: noop,
  noop,
  request,
  'resource.create': request,
  'resource.delete': request,
  'resource.get': request,
  'resource.query': request,
  'resource.update': request,
  'resource.count': request,
  'resource.subscription.status': noop,
  'resource.subscription.subscribe': noop,
  'resource.subscription.toggle': noop,
  'resource.subscription.unsubscribe': noop,
  share: noop,
  static: staticAction,
  'team.join': noop,
  'team.list': noop,
  throw: throwAction,
};
