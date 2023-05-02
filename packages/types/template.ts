import { type AppVisibility } from './app.js';

export interface Template {
  /**
   * The id of the app to clone.
   */
  templateId: number;

  /**
   * The app name to use for the newly created clone.
   */
  name: string;

  /**
   * The app description to use for the newly created clone.
   */
  description: string;

  /**
   * The organization the app should be cloned into.
   */
  organizationId: string;

  /**
   * Whether or not the cloned app may be listed in the app store.
   */
  visibility: AppVisibility;

  /**
   * Whether or not clonable resources should be cloned from the template app.
   */
  resources: boolean;
}
