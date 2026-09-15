import { type IconReference } from '@appsemble/sdk';

declare module '@appsemble/sdk' {
  interface Parameters {
    /**
     * This is an icon.
     */
    icon?: IconReference;

    /**
     * Nested icons.
     */
    buttons?: {
      /**
       * A button icon.
       */
      icon?: IconReference;
    }[];
  }
}
