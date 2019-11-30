import { IconName } from '@fortawesome/fontawesome-common-types';

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
  type?: 'date' | 'checkbox' | 'radio' | 'string';
}

export interface RangeFilter {
  from?: string | number;
  to?: string | number;
}

export interface Filter {
  [filter: string]: string | number | RangeFilter | string[];
}

export interface Parameters {
  event?: string;
  fields: FilterField[];
  highlight: string;
  refreshTimeout: number;
}

export interface Actions {
  onLoad: {};
}
