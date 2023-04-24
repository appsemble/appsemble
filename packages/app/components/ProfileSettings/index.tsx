import {
  FileUpload,
  FormButtons,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  useMessages,
} from '@appsemble/react-components';
import { type App } from '@appsemble/types';
import axios from 'axios';
import { type ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { PicturePreview } from './PicturePreview/index.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { useUser } from '../UserProvider/index.js';

export function ProfileSettings(): ReactElement {
  const { formatMessage } = useIntl();
  const { setUserInfo, userInfo } = useUser();
  const { lang } = useParams<{ lang: string }>();
  const push = useMessages();

  const onSaveProfile = useCallback(
    async (values: { name: string; email: string; picture: File }) => {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('email', values.email);
      formData.append('locale', lang);

      if (values.picture) {
        formData.append('picture', values.picture);
      }

      const { data } = await axios.patch<{
        app: App;
        email: string;
        id: string;
        name: string;
        picture: string;
      }>(`${apiUrl}/api/user/apps/${appId}/account`, formData);
      setUserInfo({
        ...userInfo,
        email: data.email,
        name: data.name,
        picture: data.picture,
      });
      push({ body: formatMessage(messages.submitSuccess), color: 'success' });
    },
    [formatMessage, push, setUserInfo, userInfo, lang],
  );

  return (
    <SimpleForm
      defaultValues={{
        name: userInfo?.name || '',
        email: userInfo?.email || '',
        picture: null,
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
      <SimpleFormField
        accept="image/jpeg, image/png, image/tiff, image/webp"
        component={FileUpload}
        fileButtonLabel={<FormattedMessage {...messages.picture} />}
        fileLabel={<FormattedMessage {...messages.selectFile} />}
        help={<FormattedMessage {...messages.pictureDescription} />}
        label={<FormattedMessage {...messages.picture} />}
        name="picture"
        preview={<PicturePreview pictureUrl={userInfo?.picture} />}
      />
      <FormButtons>
        <SimpleSubmit>
          <FormattedMessage {...messages.saveProfile} />
        </SimpleSubmit>
      </FormButtons>
    </SimpleForm>
  );
}
