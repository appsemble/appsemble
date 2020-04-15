import type { URL as URL_, URLSearchParams as URLSearchParams_ } from 'url';

declare global {
  // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/34960
  // eslint-disable-next-line no-redeclare
  const URL: typeof URL_;
  // eslint-disable-next-line no-redeclare
  const URLSearchParams: typeof URLSearchParams_;
}

declare module 'sequelize' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Model {
    // eslint-disable-next-line import/prefer-default-export
    export function associate(): void;
  }
}
