/**
 * An object that represents a named event target.
 */
export interface NamedEventTarget {
  /**
   * The name of the event target.
   */
  name?: string;
}

/**
 * An event that refers to a named event target.
 */
export interface NamedEvent<T extends NamedEventTarget = NamedEventTarget, C = T> {
  /**
   * The current event target.
   */
  currentTarget: C;
}
