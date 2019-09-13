import { Action, ActionDefinition } from '@appsemble/types';

import { MakeActionParameters } from '../../types';
import dialog from './dialog';
import flow from './flow';
import link from './link';
import log from './log';
import noop from './noop';
import request from './request';
import resource from './resource';

// XXX fix type, this requires a generic mapping key to type.
export type ActionCreator = (args: MakeActionParameters<ActionDefinition>) => Action;

export type ActionCreators = {
  [K in Action['type']]?: ActionCreator;
};

export default {
  link,
  log,
  noop,
  request,
  dialog,
  'flow.next': flow.next,
  'flow.finish': flow.finish,
  'flow.back': flow.back,
  'flow.cancel': flow.cancel,
  'resource.get': resource.get,
  'resource.query': resource.query,
  'resource.create': resource.create,
  'resource.update': resource.update,
  'resource.delete': resource.remove,
} as ActionCreators;
