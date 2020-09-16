import { Content } from '@appsemble/react-components';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { TitleBar } from '../TitleBar';
import { AppSubscriptions } from './AppSubscriptions';
import { LanguagePreference } from './LanguagePreference';
import { messages } from './messages';

/**
 * Page containing all the settings configurable for an app
 */
export function AppSettings(): ReactElement {
  return (
    <Content main padding>
      <TitleBar>
        <FormattedMessage {...messages.settings} />
      </TitleBar>
      <LanguagePreference />
      <AppSubscriptions />
    </Content>
  );
}
