import { BaseAction } from '@appsemble/sdk';
import { Block } from '@appsemble/types';

import { ActionDefinition, MakeActionParameters } from '../../types';

interface DialogActionDefinition extends ActionDefinition<'dialog'> {
  fullscreen?: boolean;
  blocks: Block[];
}

export default function dialog({
  definition,
  showDialog,
}: MakeActionParameters<DialogActionDefinition>): BaseAction<'dialog'> {
  return {
    type: 'dialog',
    dispatch(data) {
      return new Promise((resolve, reject) => {
        const close = showDialog({
          actionCreators: {
            'dialog.error': () => ({
              type: 'dialog.error',
              async dispatch(error) {
                reject(error);
                close();
              },
            }),
            'dialog.ok': () => ({
              type: 'dialog.ok',
              async dispatch(result) {
                resolve(result);
                close();
              },
            }),
          },
          blocks: definition.blocks,
          data,
          close() {
            reject();
            close();
          },
          fullscreen: definition.fullscreen,
        });
      });
    },
  };
}
