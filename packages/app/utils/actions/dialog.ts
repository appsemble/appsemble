import { type ActionCreator } from './index.js';

export const dialog: ActionCreator<'dialog'> = ({
  definition: { blocks, closable = true, fullscreen = false, title },
  prefix,
  prefixIndex,
  showDialog,
}) => [
  (data) =>
    new Promise((resolve, reject) => {
      const close = showDialog?.({
        actionCreators: {
          'dialog.error': () => [
            (error) => {
              reject(error);
              close?.();
              return error;
            },
          ],
          'dialog.ok': () => [
            (result) => {
              resolve(result);
              close?.();
              return result;
            },
          ],
        },
        blocks,
        closable,
        data,
        close() {
          close?.();
          reject(new Error('closed'));
        },
        fullscreen,
        prefix,
        prefixIndex,
        title,
      });
    }),
];
