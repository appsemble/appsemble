import {
  FileUpload,
  FormButtons,
  Icon,
  SelectField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  useMessages,
  WebcamImageUpload,
} from '@appsemble/react-components';
import { getLanguageDisplayName } from '@appsemble/utils';
import axios from 'axios';
import { type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { PicturePreview } from './PicturePreview/index.js';
import { apiUrl, appId, languages } from '../../utils/settings.js';
import { useAppMember } from '../AppMemberProvider/index.js';

export function ProfileSettings(): ReactNode {
  const { formatMessage } = useIntl();
  const { appMemberInfo, setAppMemberInfo } = useAppMember();
  const push = useMessages();
  const [pictureCamera, setPictureCamera] = useState<Blob | null>(null);
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();

  const preferredLanguage =
    appMemberInfo.locale || localStorage.getItem('preferredLanguage') || lang;

  const onCapture = useCallback(
    (data: Blob) => {
      setPictureCamera(data);
    },
    [setPictureCamera],
  );
  const onSaveProfile = useCallback(
    async (values: { name: string; picture: File; locale: string }) => {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('locale', values.locale);

      if (values.picture) {
        formData.append('picture', values.picture);
      } else if (pictureCamera) {
        formData.append('picture', pictureCamera);
      }

      const { data } = await axios.patch<{
        name: string;
        picture: string;
        locale: string;
      }>(`${apiUrl}/api/apps/${appId}/members/current`, formData);
      setAppMemberInfo({
        ...appMemberInfo,
        name: data.name,
        picture: data.picture,
        locale: data.locale,
      });
      localStorage.setItem('preferredLanguage', data.locale);
      push({ body: formatMessage(messages.submitSuccess), color: 'success' });
      navigate(`/${data.locale ?? lang}/Settings`, { replace: true });
    },
    [formatMessage, lang, navigate, push, pictureCamera, setAppMemberInfo, appMemberInfo],
  );

  return (
    <SimpleForm
      defaultValues={{
        name: appMemberInfo?.name || '',
        picture: null,
        locale: preferredLanguage,
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
        preview={
          <PicturePreview pictureCamera={pictureCamera} pictureUrl={appMemberInfo?.picture} />
        }
      />
      <SimpleFormField
        clickButtonLabel={<Icon icon="camera" size="large" />}
        component={WebcamImageUpload}
        help={<FormattedMessage {...messages.clickDescription} />}
        onCapture={onCapture}
        value={pictureCamera}
        videoButtonLabel={<FormattedMessage {...messages.clickPicture} />}
      />
      <SimpleFormField
        component={SelectField}
        help={<FormattedMessage {...messages.languageDescription} />}
        icon="language"
        label={<FormattedMessage {...messages.languageLabel} />}
        name="locale"
      >
        {languages.map((language) => (
          <option key={language} value={language}>
            {getLanguageDisplayName(language)}
          </option>
        ))}
      </SimpleFormField>
      <FormButtons>
        <SimpleSubmit>
          <FormattedMessage {...messages.saveProfile} />
        </SimpleSubmit>
      </FormButtons>
    </SimpleForm>
  );
}
