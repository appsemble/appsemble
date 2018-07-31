import React from 'react';
import {
  IntlProvider,
} from 'react-intl';


/**
 * A HOC which provides `intl` in a block written in React.
 */
// eslint-disable-next-line import/prefer-default-export
export function provideIntl(Component) {
  return class extends React.Component {
    render() {
      return (
        <IntlProvider locale="en-US" defaultLocale="en-US" textComponent={React.Fragment}>
          <Component {...this.props} />
        </IntlProvider>
      );
    }
  };
}
