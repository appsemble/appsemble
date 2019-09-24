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
  type?: 'date' | 'checkbox' | 'radio';
}

export interface RangeFilter {
  from?: string | number;
  to?: string | number;
}

export interface CheckBoxFilter {
  [key: string]: string | number | boolean;
}

export interface Filter {
  [filter: string]: string | number | RangeFilter | CheckBoxFilter;
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
