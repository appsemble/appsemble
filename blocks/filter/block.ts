import type { IconName } from '@fortawesome/fontawesome-common-types';

export interface Enum {
  value: string;
  label?: string;
  icon?: IconName;
}

export interface FilterField {
  emptyLabel?: string;
  defaultValue?: string | number;
  label?: string;
  enum?: Enum[];
  icon?: IconName;
  name: string;
  range?: boolean;
  type: 'date' | 'checkbox' | 'radio' | 'string';
  exact?: boolean;
}

export interface RangeFilter {
  from?: string | number;
  to?: string | number;
}

export interface Filter {
  [filter: string]: string | number | RangeFilter | string[];
}

declare module '@appsemble/sdk' {
  interface Parameters {
    fields: FilterField[];
    highlight: string;
    refreshTimeout: number;
  }

  interface Actions {
    onLoad: {};
  }

  interface EventEmitters {
    data: {};
  }
}
