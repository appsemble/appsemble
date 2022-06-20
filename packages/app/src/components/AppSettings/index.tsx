import { Content, useMeta } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { Main } from '../Main';
import { ProfileSettings } from '../ProfileSettings';
import { TitleBar } from '../TitleBar';
import { useUser } from '../UserProvider';
import { AppSubscriptions } from './AppSubscriptions';
import { LanguagePreference } from './LanguagePreference';
import { messages } from './messages';

/**
 * Page containing all the settings configurable for an app
 */
export function AppSettings(): ReactElement {
  useMeta(messages.settings);
  const { isLoggedIn } = useUser();
  return (
    <Content padding>
      <TitleBar>
        <FormattedMessage {...messages.settings} />
      </TitleBar>
      <Main>
        {isLoggedIn ? <ProfileSettings /> : null}
        <LanguagePreference />
        <AppSubscriptions />
      </Main>
    </Content>
  );
}
