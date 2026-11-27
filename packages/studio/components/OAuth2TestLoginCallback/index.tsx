import { Content, Message, useQuery } from '@appsemble/react-components';
import { type ReactNode, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';

/**
 * The prefix of the `localStorage` key which marks the state of a pending test login, and the name
 * of the broadcast channel which passes its result.
 */
export const oauth2TestLoginKey = 'appsemble-oauth2-test-login';

/**
 * The answer of a provider to a test login.
 */
export interface OAuth2TestLoginAnswer {
  code: string | null;
  error: string | null;
  errorDescription: string | null;
  state: string | null;
}

/**
 * Pass the answer of the provider to the window which started the test login, and close.
 */
export function OAuth2TestLoginCallback(): ReactNode {
  const qs = useQuery();

  useEffect(() => {
    // A broadcast channel reaches the windows of this origin only, also if the provider cut the
    // link to the window which opened this one.
    const channel = new BroadcastChannel(oauth2TestLoginKey);
    const answer: OAuth2TestLoginAnswer = {
      code: qs.get('code'),
      error: qs.get('error'),
      errorDescription: qs.get('error_description'),
      state: qs.get('state'),
    };
    // eslint-disable-next-line unicorn/require-post-message-target-origin
    channel.postMessage(answer);
    channel.close();
    window.close();
  }, [qs]);

  return (
    <Content>
      <Message>
        <FormattedMessage {...messages.done} />
      </Message>
    </Content>
  );
}
