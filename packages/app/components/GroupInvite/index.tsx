import { getRouteSegment } from '@appsemble/lang-sdk';
import { useLocationString } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';

import { GroupInvitePrompt } from './GroupInvitePrompt/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';

export function GroupInvite(): ReactNode {
  const { isLoggedIn } = useAppMember();
  const { getAppMessage } = useAppMessages();
  const redirect = useLocationString();
  const { lang } = useParams<{ lang: string }>();

  if (!isLoggedIn) {
    return (
      <Navigate
        to={{
          pathname: `/${lang}/${getRouteSegment('Login', getAppMessage)}`,
          search: String(new URLSearchParams({ redirect })),
        }}
      />
    );
  }

  return <GroupInvitePrompt />;
}
