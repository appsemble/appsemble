import type { BaseAction } from '@appsemble/sdk';

export default function throwAction(): BaseAction<'throw'> {
  return {
    type: 'throw',

    async dispatch(data: any) {
      throw data;
    },
  };
}
