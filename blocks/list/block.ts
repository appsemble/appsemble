import { IconName } from '@fortawesome/fontawesome-common-types';

export interface Field {
  name?: string;
  label?: string;
  icon?: IconName;
}

export interface Item {
  id?: number;
  [property: string]: any;
}

export interface Parameters {
  header?: string;
  fields?: Field[];
}

export interface Actions {
  onClick: {};
}

export interface Events {
  listen: 'data';
}
