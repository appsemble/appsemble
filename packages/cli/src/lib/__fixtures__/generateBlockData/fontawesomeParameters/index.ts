import '@appsemble/sdk';

// eslint-disable-next-line import/no-extraneous-dependencies
import { IconName } from '@fortawesome/fontawesome-common-types';

declare module '@appsemble/sdk' {
  interface Parameters {
    icon?: IconName;
  }
}
