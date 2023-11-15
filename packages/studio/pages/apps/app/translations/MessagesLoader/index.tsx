import { useData } from '@appsemble/react-components';
import { type AppMessages } from '@appsemble/types';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { AsyncDataView } from '../../../../../components/AsyncDataView/index.js';
import { useApp } from '../../index.js';
import { MessagesForm } from '../MessagesForm/index.js';

interface MessagesLoaderProps {
  /**
   * The language ID to eit messages for.
   */
  readonly languageId: string;
}

/**
 * Render a form for editing app messages.
 */
export function MessagesLoader({ languageId }: MessagesLoaderProps): ReactNode {
  const { app } = useApp();

  const result = useData<AppMessages>(`/api/apps/${app.id}/messages/${languageId}`);
  const defaultMessagesResult = useData<AppMessages>(
    `/api/apps/${app.id}/messages/${languageId}?override=false`,
  );

  return (
    <AsyncDataView
      errorMessage={<FormattedMessage {...messages.errorMessage} />}
      loadingMessage={<FormattedMessage {...messages.loadingMessage} />}
      result={result}
    >
      {(appMessages) => (
        <AsyncDataView
          errorMessage={<FormattedMessage {...messages.errorMessage} />}
          loadingMessage={<FormattedMessage {...messages.loadingMessage} />}
          result={defaultMessagesResult}
        >
          {(defaultAppMessages) => (
            <MessagesForm
              appMessages={appMessages}
              defaultAppMessages={defaultAppMessages}
              languageId={languageId}
            />
          )}
        </AsyncDataView>
      )}
    </AsyncDataView>
  );
}
