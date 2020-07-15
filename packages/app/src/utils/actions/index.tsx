import type { Action } from '@appsemble/sdk';
import type { ActionDefinition } from '@appsemble/types';

import type { MakeActionParameters } from '../../types';
import dialog from './dialog';
import event from './event';
import flow from './flow';
import link from './link';
import log from './log';
import message from './message';
import noop from './noop';
import request from './request';
import resource from './resource';
import staticAction from './static';
import throwAction from './throwAction';

// XXX fix type, this requires a generic mapping key to type.
export type ActionCreator = (args: MakeActionParameters<ActionDefinition>) => Action;

export type ActionCreators = {
  [K in Action['type']]?: ActionCreator;
};

export default {
  link,
  log,
  message,
  noop,
  throw: throwAction,
  request,
  dialog,
  event,
  'flow.next': flow.next,
  'flow.finish': flow.finish,
  'flow.back': flow.back,
  'flow.cancel': flow.cancel,
  'resource.get': resource.get,
  'resource.query': resource.query,
  'resource.create': resource.create,
  'resource.update': resource.update,
  'resource.delete': resource.remove,
  'resource.subscription.subscribe': resource.subscribe,
  'resource.subscription.unsubscribe': resource.unsubscribe,
  'resource.subscription.toggle': resource.toggleSubscribe,
  'resource.subscription.status': resource.subscriptionStatus,
  static: staticAction,
} as ActionCreators;
