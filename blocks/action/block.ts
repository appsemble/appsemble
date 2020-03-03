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

declare module '@appsemble/sdk' {
  interface Actions {
    onSubmit: {};

    onSuccess: {};

    onError: {};
  }

  interface Parameters {
    fields: Field[];
    title: string;
  }
}
