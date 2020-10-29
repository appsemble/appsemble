import { BaseAction } from '@appsemble/sdk';

export function noop(): BaseAction<'noop'> {
  return {
    type: 'noop',

    // eslint-disable-next-line require-await
    async dispatch(data: any) {
      return data;
    },
  };
}
