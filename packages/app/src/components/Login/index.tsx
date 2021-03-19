import { Content, Message, useQuery } from '@appsemble/react-components';
import { normalize } from '@appsemble/utils';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';

import { getDefaultPageName } from '../../utils/getDefaultPageName';
import { apiUrl, appId, logins, showAppsembleLogin } from '../../utils/settings';
import { useAppDefinition } from '../AppDefinitionProvider';
import { EmailLogin } from '../EmailLogin';
import { OpenIDLogin } from '../OpenIDLogin';
import { useUser } from '../UserProvider';
import { messages } from './messages';

export function Login(): ReactElement {
  const { definition } = useAppDefinition();
  const { isLoggedIn, role } = useUser();
  const qs = useQuery();
  const redirect = qs.get('redirect');

  if (isLoggedIn || !definition.security) {
    const defaultPageName = getDefaultPageName(isLoggedIn, role, definition);
    return <Redirect to={redirect || normalize(defaultPageName)} />;
  }

  if (definition.security.login === 'password') {
    return <EmailLogin />;
  }

  if (!logins.length && !showAppsembleLogin) {
    return (
      <Content padding>
        <Message color="danger">
          <p>
            <FormattedMessage
              {...messages.permissionError}
              values={{
                link: (text: string) => (
                  <a href={`${apiUrl}/apps/${appId}`} rel="noopener noreferrer" target="_blank">
                    {text}
                  </a>
                ),
              }}
            />
          </p>
        </Message>
      </Content>
    );
  }

  return <OpenIDLogin />;
}
