import type { IconName } from '@fortawesome/fontawesome-common-types';

declare module '@appsemble/sdk' {
  interface Actions {
    /**
     * Action that gets dispatched when the button is clicked.
     */
    onClick: { required: true };
  }

  interface Parameters {
    /**
     * A [Font Awesome icon](https://fontawesome.com/icons?m=free) name to render on the button.
     */
    icon: IconName;
  }
}
