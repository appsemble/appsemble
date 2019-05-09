export default function dialog(definition, app, block, history, showDialog) {
  return {
    dispatch(data) {
      return new Promise((resolve, reject) => {
        const close = showDialog({
          actionCreators: {
            'dialog.error': () => ({
              dispatch(error) {
                reject(error);
                close();
              },
            }),
            'dialog.ok': () => ({
              dispatch(result) {
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
          fullScreen: definition.fullScreen,
        });
      });
    },
  };
}
