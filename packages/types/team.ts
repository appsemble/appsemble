/**
 * Represents a team within an organization.
 */
export interface Team {
  /**
   * The ID of the team.
   */
  id: number;

  /**
   * The display name of the team.
   */
  name: string;

  /**
   * Custom annotations for the team.
   */
  annotations?: Record<string, string>;
}

export interface TeamMember extends Team {
  role: 'manager' | 'member';
}
