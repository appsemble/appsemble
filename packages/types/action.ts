import { type HTTPMethods } from './http.js';
import { type ActionDefinition, type Remapper } from './index.js';

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
export type ResourceDeleteAllAction = RequestLikeAction<'resource.delete.all'>;
export type ResourceDeleteBulkAction = RequestLikeAction<'resource.delete.bulk'>;
export type ResourceGetAction = RequestLikeAction<'resource.get'>;
export type ResourceHistoryGetAction = RequestLikeAction<'resource.history.get'>;
export type ResourceQueryAction = RequestLikeAction<'resource.query'>;
export type ResourceCountAction = RequestLikeAction<'resource.count'>;
export type ResourceUpdateAction = RequestLikeAction<'resource.update'>;
export type ResourcePatchAction = RequestLikeAction<'resource.patch'>;

/**
 * An action that can be called from within a block.
 */
export type Action =
  | BaseAction<'analytics'>
  | BaseAction<'app.member.current.patch'>
  | BaseAction<'app.member.delete'>
  | BaseAction<'app.member.invite'>
  | BaseAction<'app.member.login'>
  | BaseAction<'app.member.logout'>
  | BaseAction<'app.member.properties.patch'>
  | BaseAction<'app.member.query'>
  | BaseAction<'app.member.register'>
  | BaseAction<'app.member.role.update'>
  | BaseAction<'condition'>
  | BaseAction<'controller'>
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
  | BaseAction<'group.member.delete'>
  | BaseAction<'group.member.invite'>
  | BaseAction<'group.member.query'>
  | BaseAction<'group.member.role.update'>
  | BaseAction<'group.query'>
  | BaseAction<'link.back'>
  | BaseAction<'link.next'>
  | BaseAction<'match'>
  | BaseAction<'message'>
  | BaseAction<'noop'>
  | BaseAction<'notify'>
  | BaseAction<'resource.subscription.status'>
  | BaseAction<'resource.subscription.subscribe'>
  | BaseAction<'resource.subscription.toggle'>
  | BaseAction<'resource.subscription.unsubscribe'>
  | BaseAction<'share'>
  | BaseAction<'static'>
  | BaseAction<'storage.append'>
  | BaseAction<'storage.delete'>
  | BaseAction<'storage.read'>
  | BaseAction<'storage.subtract'>
  | BaseAction<'storage.update'>
  | BaseAction<'storage.write'>
  | BaseAction<'throw'>
  | LinkAction
  | LogAction
  | RequestAction
  | ResourceCountAction
  | ResourceCreateAction
  | ResourceDeleteAction
  | ResourceDeleteAllAction
  | ResourceDeleteBulkAction
  | ResourceGetAction
  | ResourceHistoryGetAction
  | ResourcePatchAction
  | ResourceQueryAction
  | ResourceUpdateAction;

interface ActionErrorOptions<D extends ActionDefinition> {
  /**
   * What caused the error to be thrown.
   */
  cause: unknown;

  /**
   * The action input data.
   */
  data: unknown;

  /**
   * The definition of the action that threw the error.
   */
  definition: D;

  /**
   * The HTTP status code of the error, if there is one.
   */
  status?: number;
}

/**
 * This error may be thrown by actions.
 */
export class ActionError<D extends ActionDefinition = ActionDefinition> extends Error {
  cause: unknown;

  /**
   * The action input data.
   */
  data: unknown;

  /**
   * The definition of the action that threw the error.
   */
  definition: D;

  /**
   * The HTTP status code of the error, if there is one.
   */
  status?: number;

  constructor(options: ActionErrorOptions<D>) {
    const { cause, data, definition } = options;
    super(`An error occurred while running ${definition.type}`, { cause });
    this.data = data;
    this.definition = definition;

    if (typeof cause === 'object' && cause != null && 'response' in cause) {
      const { response } = cause;
      if (typeof response === 'object' && response != null && 'status' in response) {
        const responseStatus = response.status;
        if (responseStatus && typeof responseStatus === 'number') {
          this.status = responseStatus;
        }
      }
    }
    // eslint-disable-next-line unicorn/custom-error-definition
    this.name = `ActionError(${definition.type})`;
    this.cause = cause;
    if (cause instanceof Error && cause.stack) {
      this.stack += `\n\n${cause.stack
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n')}`;
    }
  }
}
