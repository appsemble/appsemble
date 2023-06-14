export interface Quota {
  /**
   * The used quota so far.
   */
  used: number;

  /**
   * The quota usage limit.
   */
  limit: number;

  /**
   * The quota reset date in ISO 8601 format.
   */
  reset: string;
}
