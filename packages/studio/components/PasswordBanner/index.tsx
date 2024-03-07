import { Message } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import { messages } from './messages.js';
import { useUser } from '../UserProvider/index.js';

/**
 * This component should at least be present until user deletion
 * is implemented in the following manner:
 *
 * - The user has asked to delete their account explicitly.
 * - Or when the user wants to disconnect their last OAuth2 Provider and has no password,
 * and has agreed to delete the account.
 */
export function PasswordBanner(): ReactNode {
  const { hasNoLoginMethods } = useUser();

  if (hasNoLoginMethods) {
    return (
      <Message color="warning">
        <div className="is-flex is-justify-content-space-between is-align-items-center">
          <span>
            <FormattedMessage {...messages.setPasswordBanner} />
          </span>
          <span>
            <Link className="mr-2" to="reset-password">
              <FormattedMessage {...messages.setPasswordButton} />
            </Link>
            <Link className="mr-2" to="settings/social">
              <FormattedMessage {...messages.socialLoginButton} />
            </Link>
          </span>
        </div>
      </Message>
    );
  }
}
