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
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { PicturePreview } from './PicturePreview/index.js';
import { apiUrl, appId, languages, supportedLanguages } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';

const DEFAULT_IMAGE_PREFIX = 'https://www.gravatar.com/avatar/';

export function ProfileSettings(): ReactNode {
  const { formatMessage } = useIntl();
  const { appMemberInfo, setAppMemberInfo } = useAppMember();
  const { definition } = useAppDefinition();
  const push = useMessages();
  const [pictureCamera, setPictureCamera] = useState<Blob | null>(null);
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const enabledSettings = definition.layout?.enabledSettings;

  const preferredLanguage =
    appMemberInfo.locale || localStorage.getItem('preferredLanguage') || lang;

  const hasPicture = useMemo(
    () => Boolean(appMemberInfo.picture && !appMemberInfo.picture.startsWith(DEFAULT_IMAGE_PREFIX)),
    [appMemberInfo.picture],
  );

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

      if ((values.picture as unknown as string) === '') {
        formData.append('picture', '');
      }

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

  const onRemoveProfilePicture = useCallback(() => {
    setAppMemberInfo({
      ...appMemberInfo,
      picture: undefined,
    });
  }, [setAppMemberInfo, appMemberInfo]);

  return enabledSettings?.length ? (
    <SimpleForm
      defaultValues={{
        name: appMemberInfo?.name || '',
        // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
        picture: null,
        // @ts-expect-error 2322 string | undefined is not assignable to type (strictNullChecks)
        locale: preferredLanguage,
      }}
      onSubmit={onSaveProfile}
    >
      <SimpleFormError>{() => <FormattedMessage {...messages.submitError} />}</SimpleFormError>
      {enabledSettings.includes('name') ? (
        <SimpleFormField
          help={<FormattedMessage {...messages.displayNameHelp} />}
          icon="user"
          label={<FormattedMessage {...messages.displayName} />}
          name="name"
          placeholder={formatMessage(messages.displayName)}
        />
      ) : null}
      {definition.members?.phoneNumber?.enable && enabledSettings.includes('phoneNumber') ? (
        <SimpleFormField
          icon="phone"
          label={<FormattedMessage {...messages.phoneNumber} />}
          name="phoneNumber"
          placeholder={formatMessage(messages.phoneNumber)}
        />
      ) : null}
      {enabledSettings.includes('picture') ? (
        <SimpleFormField
          accept="image/jpeg, image/png, image/tiff, image/webp"
          // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
          component={FileUpload}
          fileButtonLabel={<FormattedMessage {...messages.picture} />}
          fileLabel={<FormattedMessage {...messages.selectFile} />}
          handleRemove={onRemoveProfilePicture}
          hasPicture={hasPicture}
          help={<FormattedMessage {...messages.pictureDescription} />}
          label={<FormattedMessage {...messages.picture} />}
          name="picture"
          preview={
            // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
            <PicturePreview pictureCamera={pictureCamera} pictureUrl={appMemberInfo?.picture} />
          }
        />
      ) : null}
      {enabledSettings.includes('picture') ? (
        <SimpleFormField
          clickButtonLabel={<Icon icon="camera" size="large" />}
          // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
          component={WebcamImageUpload}
          help={<FormattedMessage {...messages.clickDescription} />}
          onCapture={onCapture}
          value={pictureCamera}
          videoButtonLabel={<FormattedMessage {...messages.clickPicture} />}
        />
      ) : null}
      {enabledSettings.includes('languages') ? (
        <SimpleFormField
          component={SelectField}
          help={<FormattedMessage {...messages.languageDescription} />}
          icon="language"
          label={<FormattedMessage {...messages.languageLabel} />}
          name="locale"
        >
          {languages.map((language) => (
            <option key={language} value={language}>
              {supportedLanguages.includes(language)
                ? `${getLanguageDisplayName(language)} (${formatMessage(messages.supported)})`
                : getLanguageDisplayName(language)}
            </option>
          ))}
        </SimpleFormField>
      ) : null}
      <FormButtons>
        <SimpleSubmit>
          <FormattedMessage {...messages.saveProfile} />
        </SimpleSubmit>
      </FormButtons>
    </SimpleForm>
  ) : null;
}
