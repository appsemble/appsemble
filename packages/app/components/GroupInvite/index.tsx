import { getRouteSegment } from '@appsemble/lang-sdk';
import { type VNode } from 'preact';
import { useParams } from 'wouter-preact';

import { GroupInvitePrompt } from './GroupInvitePrompt/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { useLocationString } from '../../utils/useLocationString.js';
import { Redirect } from '../Redirect/index.js';

export function GroupInvite(): VNode {
  const { isLoggedIn } = useAppMember();
  const { getAppMessage } = useAppMessages();
  const redirect = useLocationString();
  const { lang } = useParams<{ lang: string }>();

  if (!isLoggedIn) {
    return (
      <Redirect
        to={`/${lang}/${getRouteSegment('Login', getAppMessage)}?${new URLSearchParams({ redirect })}`}
      />
    );
  }

  return <GroupInvitePrompt />;
}
