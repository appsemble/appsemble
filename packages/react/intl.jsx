import React from 'react';
import { IntlProvider } from 'react-intl';

/**
 * A HOC which provides `intl` in a block written in React.
 */
// eslint-disable-next-line import/prefer-default-export
export function provideIntl(Component, intlProviderProps) {
  return class extends React.Component {
    render() {
      return (
        <IntlProvider
          locale="en-US"
          defaultLocale="en-US"
          {...intlProviderProps}
          textComponent={React.Fragment}
        >
          <Component {...this.props} />
        </IntlProvider>
      );
    }
  };
}
