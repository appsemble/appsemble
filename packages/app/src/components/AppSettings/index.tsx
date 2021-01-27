import { Content } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { Main } from '../Main';
import { TitleBar } from '../TitleBar';
import { AppSubscriptions } from './AppSubscriptions';
import { LanguagePreference } from './LanguagePreference';
import { messages } from './messages';

/**
 * Page containing all the settings configurable for an app
 */
export function AppSettings(): ReactElement {
  return (
    <Content padding>
      <TitleBar>
        <FormattedMessage {...messages.settings} />
      </TitleBar>
      <Main>
        <LanguagePreference />
        <AppSubscriptions />
      </Main>
    </Content>
  );
}
