import {
  FormButtons,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  useMessages,
} from '@appsemble/react-components';
import { App } from '@appsemble/types';
import axios from 'axios';
import { ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { apiUrl, appId } from '../../utils/settings';
import { useUser } from '../UserProvider';
import { messages } from './messages';

export function ProfileSettings(): ReactElement {
  const { formatMessage } = useIntl();
  const { setUserInfo, userInfo } = useUser();
  const push = useMessages();

  const onSaveProfile = useCallback(
    async (values: { name: string }) => {
      const { data } = await axios.put<{
        app: App;
        email: string;
        id: string;
        name: string;
      }>(`${apiUrl}/api/user/apps/${appId}/account`, values);
      setUserInfo({
        ...userInfo,
        email: data.email,
        sub: data.id,
        name: data.name,
      });
      push({ body: formatMessage(messages.submitSuccess), color: 'success' });
    },
    [formatMessage, push, setUserInfo, userInfo],
  );

  return (
    <SimpleForm
      defaultValues={{
        name: userInfo.name || '',
      }}
      onSubmit={onSaveProfile}
    >
      <SimpleFormError>{() => <FormattedMessage {...messages.submitError} />}</SimpleFormError>
      <SimpleFormField
        help={<FormattedMessage {...messages.displayNameHelp} />}
        icon="user"
        label={<FormattedMessage {...messages.displayName} />}
        name="name"
        placeholder={formatMessage(messages.displayName)}
      />

      <FormButtons>
        <SimpleSubmit>
          <FormattedMessage {...messages.saveProfile} />
        </SimpleSubmit>
      </FormButtons>
    </SimpleForm>
  );
}
