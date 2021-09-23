import {
  FormButtons,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  useMessages,
} from '@appsemble/react-components';
import axios from 'axios';
import { ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { apiUrl, appId } from '../../utils/settings';
import { useUser } from '../UserProvider';
import { messages } from './messages';

export function ProfileSettings(): ReactElement {
  const { formatMessage } = useIntl();
  const { userInfo } = useUser();
  const push = useMessages();

  const onSaveProfile = useCallback(
    async (values: { name: string }) => {
      await axios.put(`${apiUrl}/api/apps/${appId}/member`, values);
      // RefreshUserInfo();
      push({ body: formatMessage(messages.submitSuccess), color: 'success' });
    },
    [formatMessage, push],
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
