import { ActionCreator } from '.';

export const dialog: ActionCreator<'dialog'> = ({ definition, prefix, showDialog }) => [
  (data) =>
    new Promise((resolve, reject) => {
      const close = showDialog({
        actionCreators: {
          'dialog.error': () => [
            (error) => {
              reject(error);
              close();
              return error;
            },
          ],
          'dialog.ok': () => [
            (result) => {
              resolve(result);
              close();
              return result;
            },
          ],
        },
        blocks: definition.blocks,
        closable: definition.closable ?? true,
        data,
        close() {
          reject(new Error('closed'));
          close();
        },
        fullscreen: definition.fullscreen,
        prefix,
        title: definition.title,
      });
    }),
];
