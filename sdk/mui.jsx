import {
  createGenerateClassName,
  createMuiTheme,
  jssPreset,
  MuiThemeProvider,
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
export function provideMui(Component) {
  return class extends React.Component {
    static propTypes = {
      reactRoot: PropTypes.instanceOf(HTMLElement).isRequired,
      shadowRoot: PropTypes.instanceOf(ShadowRoot).isRequired,
    };

    render() {
      const {
        reactRoot,
        shadowRoot,
      } = this.props;

      const jss = create(jssPreset());
      jss.options.insertionPoint = reactRoot;
      const popoverContainer = shadowRoot.appendChild(document.createElement('div'));

      return (
        <JssProvider jss={jss} generateClassName={createGenerateClassName()}>
          <MuiThemeProvider
            theme={createMuiTheme({
              props: {
                MuiPopover: {
                  container: () => popoverContainer,
                },
              },
            })}
          >
            <Component {...this.props} />
          </MuiThemeProvider>
        </JssProvider>
      );
    }
  };
}
