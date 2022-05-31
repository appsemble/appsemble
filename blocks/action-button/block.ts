import { IconName, Remapper } from '@appsemble/sdk';

declare module '@appsemble/sdk' {
  interface Actions {
    /**
     * Action that gets dispatched when the button is clicked.
     */
    onClick: never;
  }

  interface Parameters {
    /**
     * A [Font Awesome icon](https://fontawesome.com/icons?m=free) name to render on the button.
     */
    icon: IconName;

    /**
     * The title for the button.
     *
     * Describe what the button does. This helps with accessibility for people using screen readers.
     */
    title?: Remapper;
  }
}
