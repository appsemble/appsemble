import { Content, useMeta } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { AppSubscriptions } from './AppSubscriptions/index.js';
import { LanguagePreference } from './LanguagePreference/index.js';
import { messages } from './messages.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { Main } from '../Main/index.js';
import { ProfileSettings } from '../ProfileSettings/index.js';
import { AppBar } from '../TitleBar/index.js';

/**
 * Page containing all the settings configurable for an app
 */
export function AppSettings(): ReactNode {
  useMeta(messages.settings);
  const { isLoggedIn } = useAppMember();
  return (
    <Content padding>
      <AppBar>
        <FormattedMessage {...messages.settings} />
      </AppBar>
      <Main>
        {isLoggedIn ? <ProfileSettings /> : <LanguagePreference />}
        <AppSubscriptions />
      </Main>
    </Content>
  );
}
