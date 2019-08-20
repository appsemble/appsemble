import * as React from 'react';
import { IntlConfig, IntlProvider } from 'react-intl';

import { BlockProps } from '.';

/**
 * A HOC which provides `intl` in a block written in React.
 */
// eslint-disable-next-line import/prefer-default-export
export function provideIntl<P = any, A = {}>(
  Component: React.ComponentType<BlockProps<P, A>>,
  intlProviderProps?: Partial<IntlConfig>,
): React.ComponentType<BlockProps<P, A>> {
  return props => (
    <IntlProvider defaultLocale="en-US" locale="en-US" {...intlProviderProps}>
      <Component {...props} />
    </IntlProvider>
  );
}
