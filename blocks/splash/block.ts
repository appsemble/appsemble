// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Parameters {}

export interface Actions {
  /**
   * This action is dispatched with the given data.
   */
  load: {};

  /**
   * This action is dispatched if the load action has failed.
   */
  error: {};

  /**
   * This action is dispatched if the load action was successful.
   */
  success: {};
}
