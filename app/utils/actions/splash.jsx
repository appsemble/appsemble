import React from 'react';

import SplashAction from '../../components/SplashAction';

export default function splash(definition, app, block, history, showDialog) {
  return {
    dispatch(data) {
      return new Promise((resolve, reject) => {
        let close;
        const actionCreators = {
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
        };
        close = showDialog(
          <SplashAction actionCreators={actionCreators} data={data} definition={definition} />,
        );
      });
    },
  };
}
