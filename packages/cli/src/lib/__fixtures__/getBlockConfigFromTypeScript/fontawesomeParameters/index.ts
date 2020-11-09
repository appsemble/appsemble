import '@appsemble/sdk';

import { IconName } from '@fortawesome/fontawesome-common-types';

declare module '@appsemble/sdk' {
  interface Parameters {
    icon?: IconName;
  }
}
