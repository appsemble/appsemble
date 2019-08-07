import { IconName } from '@fortawesome/fontawesome-common-types';

export interface Actions {
  /**
   * The action to dispatch when the button is clicked.
   */
  onClick: {};
}

export interface Parameters {
  /**
   * The icon to render on the button.
   */
  icon: IconName;
}
