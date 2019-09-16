export interface Field {
  name: string;
  label?: string;
}

export interface Parameters {
  fields: Field[];
}

export interface Actions {
  onLoad: {};
  onClick: {};
}
