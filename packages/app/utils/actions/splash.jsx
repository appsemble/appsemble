export default function splash(definition, app, block, history, showDialog) {
  return {
    dispatch(data) {
      return new Promise((resolve, reject) => {
        const close = showDialog({
          actionCreators: {
            'splash.error': () => ({
              dispatch(error) {
                reject(error);
                close();
              },
            }),
            'splash.ok': () => ({
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
