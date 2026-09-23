import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { AppSubscriptions } from './AppSubscriptions/index.js';
import { LanguagePreference } from './LanguagePreference/index.js';
import { messages } from './messages.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { BuiltinPage } from '../BuiltinPage/index.js';
import { ProfileSettings } from '../ProfileSettings/index.js';

/**
 * Page containing all the settings configurable for an app
 */
export function AppSettings(): ReactNode {
  const { isLoggedIn } = useAppMember();
  const { definition } = useAppDefinition();
  const enabledSettings = definition.layout?.enabledSettings;

  return (
    <BuiltinPage
      appBarName={<FormattedMessage {...messages.settings} />}
      narrow
      page="settings"
      state="default"
      title={messages.settings}
    >
      {isLoggedIn && enabledSettings?.length ? (
        <ProfileSettings />
      ) : enabledSettings?.includes('languages') ? (
        <LanguagePreference />
      ) : null}
      <AppSubscriptions />
    </BuiltinPage>
  );
}
