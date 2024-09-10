/**
 * Represents a group within an organization.
 */
export interface Group {
  /**
   * The ID of the group.
   */
  id: number;

  /**
   * The display name of the group.
   */
  name: string;

  /**
   * Custom annotations for the group.
   */
  annotations?: Record<string, string>;
}
