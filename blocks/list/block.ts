import { IconName } from '@fortawesome/fontawesome-common-types';

export interface Field {
  name?: string;
  label?: string;
  icon?: IconName;
}

export interface Item {
  id?: number;
}

declare module '@appsemble/sdk' {
  interface Parameters {
    header?: string;
    fields?: Field[];
  }

  interface Actions {
    onClick: {};
  }

  interface EventListeners {
    data: {};
  }
}
