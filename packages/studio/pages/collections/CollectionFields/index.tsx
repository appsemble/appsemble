import {
  Button,
  CheckboxField,
  FileUpload,
  Message,
  SimpleFormField,
  TextAreaField,
  useSimpleForm,
  useToggle,
} from '@appsemble/react-components';
import { type SSLStatus } from '@appsemble/types';
import { domainPattern, normalize } from '@appsemble/utils';
import { type ChangeEvent, type ReactNode, useCallback } from 'react';
import { FormattedMessage, type MessageDescriptor, useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { AvatarEditorModal } from '../../../components/AvatarEditorModal/index.js';
import { useSSLStatus } from '../../../components/useSSLStatus.js';

function preprocessDomain(domain: string): string {
  return domain
    .trim()
    .replace(/^https?:\/\//, '')
    .split(/\./g)
    .map((node) => normalize(node, false).slice(0, 63))
    .join('.');
}

function getSSLMessage(status: SSLStatus): MessageDescriptor {
  switch (status) {
    case 'error':
      return messages.sslError;
    case 'missing':
      return messages.sslMissing;
    case 'pending':
      return messages.sslPending;
    case 'ready':
      return messages.sslReady;
    default:
      return messages.sslUnknown;
  }
}

interface CollectionFieldsProps {
  readonly header: File | null;
  readonly expertPhoto: File | null;
  readonly onHeaderChange: (file: File | null) => void;
  readonly onExpertPhotoChange: (file: File | null) => void;
}

export function CollectionFields({
  expertPhoto,
  header,
  onExpertPhotoChange,
  onHeaderChange,
}: CollectionFieldsProps): ReactNode {
  const { lang } = useParams<{ lang: string }>();

  const avatarModalToggle = useToggle();

  const { setValue, values } = useSimpleForm();

  const { formatMessage } = useIntl();

  const sslStatus = useSSLStatus(values.domain === '' ? undefined : values.domain);

  const handleExpertPhotoChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onExpertPhotoChange(event.target.files?.[0] ?? null);
      if (event.currentTarget.files[0]) {
        avatarModalToggle.enable();
      }
    },
    [avatarModalToggle, onExpertPhotoChange],
  );
  const handleHeaderChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onHeaderChange(event.target.files?.[0] ?? null);
    },
    [onHeaderChange],
  );

  return (
    <>
      <SimpleFormField
        label={<FormattedMessage {...messages.name} />}
        maxLength={30}
        minLength={1}
        name="name"
        required
      />
      <SimpleFormField
        accept="image/png,image/jpeg,image/tiff,image/webp"
        component={FileUpload}
        fileButtonLabel={<FormattedMessage {...messages.headerImage} />}
        fileLabel={header?.name ?? <FormattedMessage {...messages.noFile} />}
        label={<FormattedMessage {...messages.headerImage} />}
        name="headerImage"
        onChange={handleHeaderChange}
        required
      />
      <SimpleFormField
        component={CheckboxField}
        label={<FormattedMessage {...messages.private} />}
        name="isPrivate"
        title={<FormattedMessage {...messages.privateExplanation} />}
      />
      <SimpleFormField
        label={<FormattedMessage {...messages.expertName} />}
        maxLength={30}
        minLength={1}
        name="expertName"
        required
      />
      <SimpleFormField
        component={TextAreaField}
        label={<FormattedMessage {...messages.expertDescription} />}
        maxLength={4000}
        minLength={1}
        name="expertDescription"
      />
      <Message>
        <FormattedMessage
          {...messages.markdownTips}
          values={{
            markdownLink: (
              <a
                href="https://www.markdownguide.org/cheat-sheet/"
                rel="noopener noreferrer"
                target="_blank"
              >
                Markdown
              </a>
            ),
            imageHostingLink: (
              <a href="https://imgur.com/" rel="noopener noreferrer" target="_blank">
                Imgur
              </a>
            ),
          }}
        />
      </Message>
      <SimpleFormField
        accept="image/png,image/jpeg,image/tiff,image/webp"
        component={FileUpload}
        fileButtonLabel={<FormattedMessage {...messages.expertPhoto} />}
        fileLabel={expertPhoto?.name ?? <FormattedMessage {...messages.noFile} />}
        label={<FormattedMessage {...messages.expertPhoto} />}
        name="expertProfileImage"
        onChange={handleExpertPhotoChange}
        required
      />
      <SimpleFormField
        addonLeft={
          <Button
            className={`is-light ${
              sslStatus
                ? sslStatus[values.domain] === 'ready'
                  ? 'is-success'
                  : 'is-danger'
                : 'is-loading'
            }`}
            component="label"
            htmlFor="domain"
            title={formatMessage(getSSLMessage(sslStatus?.[values.domain]))}
          >
            {`${window.location.protocol}//`}
          </Button>
        }
        help={
          <FormattedMessage
            {...messages.domainDescription}
            values={{
              link: (link) => (
                <Link rel="noopener noreferrer" target="_blank" to={`/${lang}/docs/03-guide/dns`}>
                  {link}
                </Link>
              ),
            }}
          />
        }
        label={<FormattedMessage {...messages.domain} />}
        maxLength={253}
        name="domain"
        pattern={domainPattern}
        preprocess={preprocessDomain}
        validityMessages={{
          patternMismatch: <FormattedMessage {...messages.domainError} />,
        }}
      />
      <AvatarEditorModal
        onCanceled={() => {
          setValue('expertProfileImage', null);
          onExpertPhotoChange(null);
        }}
        onCompleted={onExpertPhotoChange}
        photo={expertPhoto}
        state={avatarModalToggle}
      />
    </>
  );
}
