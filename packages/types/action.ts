import { HTTPMethods } from './http.js';
import { Remapper } from './index.js';

interface BaseAction<T extends string> {
  /**
   * A function which can be called to dispatch the action.
   */
  <R>(data?: any, context?: Record<string, any>): Promise<R>;

  /**
   * The type of the action.
   */
  type: T;
}

export interface LinkAction extends BaseAction<'link'> {
  /**
   * Get the link that the action would link to if the given data was passed.
   */
  href: (data?: unknown) => string;
}

export interface LogAction extends BaseAction<'log'> {
  /**
   * The logging level.
   */
  level: 'error' | 'info' | 'warn';
}

interface RequestLikeAction<T extends Action['type']> extends BaseAction<T> {
  /**
   * The HTTP method used to make the request.
   */
  method: HTTPMethods;
  /**
   * The URL to which the request will be made.
   */
  url: Remapper;
}

export type RequestAction = RequestLikeAction<'request'>;
export type ResourceCreateAction = RequestLikeAction<'resource.create'>;
export type ResourceDeleteAction = RequestLikeAction<'resource.delete'>;
export type ResourceGetAction = RequestLikeAction<'resource.get'>;
export type ResourceQueryAction = RequestLikeAction<'resource.query'>;
export type ResourceCountAction = RequestLikeAction<'resource.count'>;
export type ResourceUpdateAction = RequestLikeAction<'resource.update'>;

/**
 * An action that can be called from within a block.
 */
export type Action =
  | BaseAction<'analytics'>
  | BaseAction<'condition'>
  | BaseAction<'dialog.error'>
  | BaseAction<'dialog.ok'>
  | BaseAction<'dialog'>
  | BaseAction<'download'>
  | BaseAction<'each'>
  | BaseAction<'email'>
  | BaseAction<'event'>
  | BaseAction<'flow.back'>
  | BaseAction<'flow.cancel'>
  | BaseAction<'flow.finish'>
  | BaseAction<'flow.next'>
  | BaseAction<'flow.to'>
  | BaseAction<'link.back'>
  | BaseAction<'link.next'>
  | BaseAction<'message'>
  | BaseAction<'noop'>
  | BaseAction<'resource.subscription.status'>
  | BaseAction<'resource.subscription.subscribe'>
  | BaseAction<'resource.subscription.toggle'>
  | BaseAction<'resource.subscription.unsubscribe'>
  | BaseAction<'share'>
  | BaseAction<'static'>
  | BaseAction<'storage.append'>
  | BaseAction<'storage.read'>
  | BaseAction<'storage.subtract'>
  | BaseAction<'storage.update'>
  | BaseAction<'storage.write'>
  | BaseAction<'team.invite'>
  | BaseAction<'team.join'>
  | BaseAction<'team.list'>
  | BaseAction<'throw'>
  | BaseAction<'user.login'>
  | BaseAction<'user.register'>
  | BaseAction<'user.update'>
  | LinkAction
  | LogAction
  | RequestAction
  | ResourceCountAction
  | ResourceCreateAction
  | ResourceDeleteAction
  | ResourceGetAction
  | ResourceQueryAction
  | ResourceUpdateAction;
