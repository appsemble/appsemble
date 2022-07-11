import { Action, ActionDefinition } from '@appsemble/types';

import { MakeActionParameters } from '../../types';
import { analytics } from './analytics';
import { condition } from './condition';
import { dialog } from './dialog';
import { download } from './download';
import { email } from './email';
import { event } from './event';
import * as flow from './flow';
import { back, link, next } from './link';
import { log } from './log';
import { message } from './message';
import { noop } from './noop';
import { request } from './request';
import * as resource from './resource';
import { share } from './share';
import { staticAction } from './static';
import { read, write } from './storage';
import { teamInvite, teamJoin, teamList } from './team';
import { throwAction } from './throw';
import { login, register, update } from './user';

type ActionProperties<T extends ActionDefinition['type']> = Omit<
  Extract<Action, { type: T }>,
  'dispatch' | 'type'
>;

/**
 * A type which takes some parameters and returns an action of the specified type.
 *
 * @param params The input params passed in by `makeActions`.
 * @returns An tuple containing the action implementation and additional properties, if relevant.
 */
export type ActionCreator<T extends ActionDefinition['type']> = (
  params: MakeActionParameters<ActionDefinition & { type: T }>,
) => [
  (data: unknown, context: Record<string, any>) => unknown,
  ...(keyof ActionProperties<T> extends never ? [] : [ActionProperties<T>]),
];

/**
 * A mapping of basic action creators.
 */
export type ActionCreators = {
  [K in Action['type']]?: ActionCreator<K>;
};

export const actionCreators: ActionCreators = {
  analytics,
  condition,
  download,
  link,
  'link.back': back,
  'link.next': next,
  log,
  message,
  noop,
  throw: throwAction,
  request,
  dialog,
  event,
  email,
  'flow.next': flow.next,
  'flow.finish': flow.finish,
  'flow.back': flow.back,
  'flow.cancel': flow.cancel,
  'flow.to': flow.to,
  'resource.get': resource.get,
  'resource.query': resource.query,
  'resource.count': resource.count,
  'resource.create': resource.create,
  'resource.update': resource.update,
  'resource.delete': resource.remove,
  'resource.subscription.subscribe': resource.subscribe,
  'resource.subscription.unsubscribe': resource.unsubscribe,
  'resource.subscription.toggle': resource.toggle,
  'resource.subscription.status': resource.status,
  share,
  static: staticAction,
  'storage.read': read,
  'storage.write': write,
  'team.invite': teamInvite,
  'team.join': teamJoin,
  'team.list': teamList,
  'user.login': login,
  'user.register': register,
  'user.update': update,
};
