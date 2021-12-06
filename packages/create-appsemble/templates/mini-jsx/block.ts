import { IconName, Remapper } from '@appsemble/sdk';

export interface Field {
  /**
   * The value of the property to render.
   */
  value: Remapper;

  /**
   * The fontawesome icon to render.
   */
  icon: IconName;

  /**
   * The label to render.
   */
  label?: Remapper;
}

declare module '@appsemble/sdk' {
  interface EventListeners {
    data: {};
  }

  interface Parameters {
    fields: Field[];
  }
}
