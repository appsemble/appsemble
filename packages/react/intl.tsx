import * as React from 'react';
import { IntlProvider } from 'react-intl';

import { BlockProps } from '.';

/**
 * A HOC which provides `intl` in a block written in React.
 */
// eslint-disable-next-line import/prefer-default-export
export function provideIntl<P = any, A = {}>(
  Component: React.ComponentType<BlockProps<P, A>>,
  intlProviderProps?: IntlProvider.Props,
): React.ComponentType<BlockProps<P, A>> {
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
