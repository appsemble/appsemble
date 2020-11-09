import { BaseAction } from '@appsemble/sdk';
import { MessageActionDefinition } from '@appsemble/types';

import { MakeActionParameters } from '../../types';

export function message({
  definition,
  remap,
  showMessage,
}: MakeActionParameters<MessageActionDefinition>): BaseAction<'message'> {
  const { body, color = 'info', dismissable, timeout } = definition;

  return {
    type: 'message',
    // eslint-disable-next-line require-await
    async dispatch(data: any) {
      showMessage({ body: remap(body, data), color, dismissable, timeout });
      return data;
    },
  };
}
