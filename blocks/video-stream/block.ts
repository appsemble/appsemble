import { IconName } from '@appsemble/sdk';

export {};

declare module '@appsemble/sdk' {
  interface Actions {
    /**
     * What happens if the button is clicked.
     */
    onClick: {};
  }

  interface Parameters {
    /**
     * A [Font Awesome icon](https://fontawesome.com/icons?m=free) name to render on the button.
     */
    icon: IconName;
  }
}
