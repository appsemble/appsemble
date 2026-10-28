import axios from 'axios';
import { type ComponentType, type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { SimpleFormError } from '../index.js';

interface BreachedPasswordSimpleFormErrorProps {
  readonly children: ComponentType<{ error: Error }>;
}

/**
 * A `SimpleFormError` for forms that set a new password.
 *
 * If the server rejected the new password because it appears in a known data breach, this shows a
 * message saying so. Any other error is rendered by `children`, like `SimpleFormError` does.
 */
export function BreachedPasswordSimpleFormError({
  children: Children,
}: BreachedPasswordSimpleFormErrorProps): ReactNode {
  return (
    <SimpleFormError>
      {({ error }) =>
        axios.isAxiosError(error) && error.response?.data?.data?.breachedPassword === true ? (
          <FormattedMessage {...messages.breachedPassword} />
        ) : (
          <Children error={error} />
        )
      }
    </SimpleFormError>
  );
}
