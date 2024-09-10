import { type Action, type ActionDefinition } from '@appsemble/types';

import { analytics } from './analytics.js';
import { login, logout, query, register, remove, update } from './appMember.js';
import { condition } from './condition.js';
import { controller } from './controller.js';
import { dialog } from './dialog.js';
import { download } from './download.js';
import { each } from './each.js';
import { email } from './email.js';
import { event } from './event.js';
import * as flow from './flow.js';
import { back, link, next } from './link.js';
import { log } from './log.js';
import { match } from './match.js';
import { message } from './message.js';
import { noop } from './noop.js';
import { notify } from './notify.js';
import { request } from './request.js';
import * as resource from './resource.js';
import { share } from './share.js';
import { staticAction } from './static.js';
import * as storage from './storage.js';
import { groupInvite, groupJoin, groupList, groupMembers } from './group.js';
import { throwAction } from './throw.js';
import { type MakeActionParameters } from '../../types.js';

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
  controller,
  download,
  dialog,
  each,
  event,
  email,
  'flow.next': flow.next,
  'flow.finish': flow.finish,
  'flow.back': flow.back,
  'flow.cancel': flow.cancel,
  'flow.to': flow.to,
  link,
  'link.back': back,
  'link.next': next,
  log,
  match,
  message,
  noop,
  notify,
  request,
  'resource.get': resource.get,
  'resource.query': resource.query,
  'resource.count': resource.count,
  'resource.create': resource.create,
  'resource.update': resource.update,
  'resource.patch': resource.patch,
  'resource.delete': resource.remove,
  'resource.subscription.subscribe': resource.subscribe,
  'resource.subscription.unsubscribe': resource.unsubscribe,
  'resource.subscription.toggle': resource.toggle,
  'resource.subscription.status': resource.status,
  share,
  static: staticAction,
  'storage.read': storage.read,
  'storage.write': storage.write,
  'storage.append': storage.append,
  'storage.subtract': storage.subtract,
  'storage.update': storage.update,
  'storage.delete': storage.remove,
  'group.invite': groupInvite,
  'group.join': groupJoin,
  'group.list': groupList,
  'group.members': groupMembers,
  throw: throwAction,
  'app.member.login': login,
  'app.member.register': register,
  'app.member.update': update,
  'app.member.logout': logout,
  'app.member.query': query,
  'app.member.remove': remove,
};
