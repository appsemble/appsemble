import dialog from './dialog';
import flow from './flow';
import link from './link';
import log from './log';
import noop from './noop';
import request from './request';
import resource from './resource';

export default {
  link,
  log,
  noop,
  request,
  dialog,
  'flow.next': flow.next,
  'flow.back': flow.back,
  'flow.skip': flow.skip,
  'resource.get': resource.get,
  'resource.query': resource.query,
  'resource.create': resource.create,
  'resource.update': resource.update,
  'resource.delete': resource.remove,
};
