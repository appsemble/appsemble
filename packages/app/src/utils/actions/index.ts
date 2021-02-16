import { Action } from '@appsemble/sdk';
import { ActionDefinition } from '@appsemble/types';

import { MakeActionParameters } from '../../types';
import { dialog } from './dialog';
import { email } from './email';
import { event } from './event';
import * as flow from './flow';
import { back, link, next } from './link';
import { log } from './log';
import { message } from './message';
import { noop } from './noop';
import { request } from './request';
import * as resource from './resource';
import { staticAction } from './static';
import { teamJoin, teamList } from './team';
import { throwAction } from './throwAction';

// XXX fix type, this requires a generic mapping key to type.
export type ActionCreator = (args: MakeActionParameters<ActionDefinition>) => Action;

export type ActionCreators = {
  [K in Action['type']]?: ActionCreator;
};

export const actionCreators = {
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
  'resource.get': resource.get,
  'resource.query': resource.query,
  'resource.count': resource.count,
  'resource.create': resource.create,
  'resource.update': resource.update,
  'resource.delete': resource.remove,
  'resource.subscription.subscribe': resource.subscribe,
  'resource.subscription.unsubscribe': resource.unsubscribe,
  'resource.subscription.toggle': resource.toggleSubscribe,
  'resource.subscription.status': resource.subscriptionStatus,
  static: staticAction,
  'team.join': teamJoin,
  'team.list': teamList,
} as ActionCreators;
