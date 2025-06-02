import { type ActionDefinition } from './actionDefinition.js';

export interface ActionErrorOptions<D extends ActionDefinition> {
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
