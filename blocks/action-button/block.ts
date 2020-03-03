import { IconName } from '@fortawesome/fontawesome-common-types';

declare module '@appsemble/sdk' {
  interface Actions {
    /**
     * The action to dispatch when the button is clicked.
     */
    onClick: {};
  }

  interface Parameters {
    /**
     * The icon to render on the button.
     */
    icon: IconName;
  }
}
