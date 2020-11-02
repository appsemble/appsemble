import { ActionDefinition, BaseActionDefinition } from '@appsemble/types';

import { App, User } from '../../models';
import { Mailer } from '../email/Mailer';

export interface ServerActionParameters<T extends ActionDefinition = BaseActionDefinition<'noop'>> {
  app: App;
  action: T;
  user: User;
  mailer: Mailer;
  data: unknown;
}

function noop({ data }: ServerActionParameters): any {
  return data;
}

function throwAction({ data }: ServerActionParameters): never {
  throw data;
}

export const actions = {
  throw: throwAction,
  noop,
  request: noop,
  email: noop,
  dialog: noop,
  event: noop,
  static: noop,
  'resource.get': noop,
  'resource.query': noop,
  'resource.update': noop,
  'resource.delete': noop,
  'resource.create': noop,
  'resource.subscription.subscribe': noop,
  'resource.subscription.unsubscribe': noop,
  'resource.subscription.status': noop,
  'resource.subscription.toggle': noop,
  'flow.back': noop,
  'flow.cancel': noop,
  'flow.finish': noop,
  'flow.next': noop,
  link: noop,
  log: noop,
  message: noop,
};
