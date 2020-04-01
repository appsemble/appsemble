import * as React from 'react';
import { IntlConfig, IntlProvider } from 'react-intl';

import type { BlockProps } from '.';

/**
 * A HOC which provides `intl` in a block written in React.
 */
// eslint-disable-next-line import/prefer-default-export
export function provideIntl(
  Component: React.ComponentType,
  intlProviderProps?: Partial<IntlConfig>,
): React.ComponentType<BlockProps> {
  return (props) => (
    <IntlProvider defaultLocale="en-US" locale="en-US" {...intlProviderProps}>
      <Component {...props} />
    </IntlProvider>
  );
}
