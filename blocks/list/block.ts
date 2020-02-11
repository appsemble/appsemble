export interface Field {
  name: string;
  label?: string;
}

export interface Parameters {
  fields: Field[];
}

export interface Actions {
  onClick: {};
}

export interface Events {
  listen: 'data';
}
