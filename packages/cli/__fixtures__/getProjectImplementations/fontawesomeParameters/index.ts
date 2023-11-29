import '@appsemble/sdk';
import { type IconName } from '@fortawesome/fontawesome-common-types';

declare module '@appsemble/sdk' {
  interface Parameters {
    /**
     * This is an icon.
     */
    icon?: IconName;
  }
}
