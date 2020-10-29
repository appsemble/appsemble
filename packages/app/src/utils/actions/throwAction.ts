import { BaseAction } from '@appsemble/sdk';

export function throwAction(): BaseAction<'throw'> {
  return {
    type: 'throw',

    // eslint-disable-next-line require-await
    async dispatch(data: unknown) {
      throw data;
    },
  };
}
