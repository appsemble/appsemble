import {
  createGenerateClassName,
  jssPreset,
} from '@material-ui/core';
import {
  create,
} from 'jss';
import PropTypes from 'prop-types';
import React from 'react';
import {
  JssProvider,
} from 'react-jss';


/**
 * A HOC which provides `jss` in a block written in React, in a way that works in the shadow DOM.
 */
// eslint-disable-next-line import/prefer-default-export
export function provideJss(Component) {
  return class extends React.Component {
    static propTypes = {
      reactRoot: PropTypes.instanceOf(HTMLElement).isRequired,
    };

    render() {
      const {
        reactRoot,
      } = this.props;

      const jss = create(jssPreset());
      jss.options.insertionPoint = reactRoot;

      return (
        <JssProvider jss={jss} generateClassName={createGenerateClassName()}>
          <Component {...this.props} />
        </JssProvider>
      );
    }
  };
}
