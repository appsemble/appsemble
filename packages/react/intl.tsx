import * as React from 'react';
import { IntlProvider } from 'react-intl';

/**
 * A HOC which provides `intl` in a block written in React.
 */
// eslint-disable-next-line import/prefer-default-export
export function provideIntl(
  Component: React.ComponentType,
  intlProviderProps: IntlProvider.Props,
): React.ComponentType {
  return props => (
    <IntlProvider
      defaultLocale="en-US"
      locale="en-US"
      {...intlProviderProps}
      textComponent={React.Fragment}
    >
      <Component {...props} />
    </IntlProvider>
  );
}
