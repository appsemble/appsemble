export interface Field {
  label?: string;
  latitude?: string;
  longitude?: string;
  name: string;
  repeated?: boolean;
  repeatedName: string;
  type: 'file' | 'geocoordinates' | 'string';
}

export interface Actions {
  onLoad: {};
}

export interface Parameters {
  fields: Field[];
}
