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
