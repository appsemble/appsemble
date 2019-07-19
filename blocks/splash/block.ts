// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Parameters {}

export interface Actions {
  /**
   * This action is dispatched with the given data.
   */
  onLoad: {};

  /**
   * This action is dispatched if the load action has failed.
   */
  onError: {};

  /**
   * This action is dispatched if the load action was successful.
   */
  onSuccess: {};
}
