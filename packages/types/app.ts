/**
 * The app visibility of the app in the Appsemble app store.
 *
 * This doesn’t affect whether or not the app can be accessed on its own domain.
 *
 * - **public**: The app is publicly listed in the Appsemble app store.
 * - **unlisted**: The app store page can be accessed, but the app isn’t listed publicly in the
 * Appsemble app store.
 * - **private**: The app is only visible to people who are part of the organization.
 */
export type AppVisibility = 'private' | 'public' | 'unlisted';

/**
 * This defines how teams are handled by an app.
 */
export interface TeamsDefinition {
  /**
   * If this is set to `anyone`, any logged in user may join a team. If this is set to `invite`,
   * only users may join who have been invited.
   */
  join: 'anyone' | 'invite';

  /**
   * A list of app roles which may create a team.
   *
   * By default teams can only be created from Appsemble Studio.
   *
   * @default []
   */
  create?: string[];

  /**
   * The roles here determine which users may invite a team member.
   *
   * The special roles `$team:member` and `$team:manager` mean that users who are already member of
   * manager of the team may also invite new members.
   */
  invite: string[];
}
