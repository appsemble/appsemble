import { IconName } from '@fortawesome/fontawesome-common-types';

interface EnumField {
  label?: string;
  value: string | number;
}

export interface Field {
  backgroundColor?: string;
  color?: string;
  name: string;
  /**
   * @minItems 1
   */
  enum?: EnumField[];
  icon: IconName;
  label?: string;
  value?: string;
}

export interface Actions {
  onSubmit: {};

  onSuccess: {};

  onError: {};
}

export interface Parameters {
  fields: Field[];
  title: string;
}
