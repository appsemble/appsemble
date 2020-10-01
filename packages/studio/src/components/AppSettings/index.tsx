import {
  Button,
  CheckboxField,
  Content,
  FileUpload,
  FormButtons,
  Message,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  useConfirmation,
  useMessages,
  useObjectURL,
} from '@appsemble/react-components';
import type { App } from '@appsemble/types';
import { domainPattern, normalize } from '@appsemble/utils';
import axios from 'axios';
import React, { ChangeEvent, ReactElement, useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useHistory, useParams } from 'react-router-dom';

import { useApp } from '../AppContext';
import styles from './index.css';
import { messages } from './messages';

function preprocessDomain(domain: string): string {
  return domain
    .trim()
    .replace(/^https?:\/\//, '')
    .split(/\./g)
    .map((node) => normalize(node, false).slice(0, 63))
    .join('.');
}

/**
 * Render the app settings view.
 */
export function AppSettings(): ReactElement {
  const { app } = useApp();
  const { formatMessage } = useIntl();
  const [icon, setIcon] = useState<File>();

  const push = useMessages();
  const iconUrl = useObjectURL(icon || app.iconUrl);
  const history = useHistory();
  const { lang } = useParams<{ lang: string }>();

  // This is needed, because the app domain may be null.
  const defaultValues = useMemo(() => ({ ...app, domain: app.domain ?? '' }), [app]);

  const onSubmit = async (values: App): Promise<void> => {
    const data = new FormData();
    data.set('domain', values.domain);
    data.set('path', values.path);
    data.set('private', String(values.private));
    if (icon) {
      data.set('icon', icon);
    }

    await axios.patch(`/api/apps/${app.id}`, data);
    push({ color: 'success', body: formatMessage(messages.updateSuccess) });
  };

  const onIconChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    setIcon(e.currentTarget.files[0]);
  }, []);

  const onDelete = useConfirmation({
    title: <FormattedMessage {...messages.deleteWarningTitle} />,
    body: <FormattedMessage {...messages.deleteWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.delete} />,
    async action() {
      const { OrganizationId, id, path } = app;

      try {
        await axios.delete(`/api/apps/${id}`);
        push({
          body: formatMessage(messages.deleteSuccess, {
            name: `@${OrganizationId}/${path}`,
          }),
          color: 'info',
        });
        history.push('/apps');
      } catch {
        push(formatMessage(messages.errorDelete));
      }
    },
  });

  return (
    <>
      <Content>
        <SimpleForm defaultValues={defaultValues} onSubmit={onSubmit}>
          <FileUpload
            accept="image/jpeg, image/png, image/tiff, image/webp"
            fileButtonLabel={<FormattedMessage {...messages.icon} />}
            fileLabel={icon?.name || <FormattedMessage {...messages.noFile} />}
            help={<FormattedMessage {...messages.iconDescription} />}
            label={<FormattedMessage {...messages.icon} />}
            name="icon"
            onChange={onIconChange}
            preview={
              <figure className="image is-128x128 mb-2">
                <img alt={formatMessage(messages.icon)} className={styles.icon} src={iconUrl} />
              </figure>
            }
          />
          <SimpleFormError>{() => <FormattedMessage {...messages.updateError} />}</SimpleFormError>
          <SimpleFormField
            component={CheckboxField}
            help={<FormattedMessage {...messages.privateDescription} />}
            label={<FormattedMessage {...messages.privateLabel} />}
            name="private"
            title={<FormattedMessage {...messages.private} />}
          />
          <SimpleFormField
            addon={
              <span className="button is-static">
                {`.${app.OrganizationId}.${window.location.host}`}
              </span>
            }
            help={<FormattedMessage {...messages.pathDescription} />}
            label={<FormattedMessage {...messages.path} />}
            maxLength={30}
            name="path"
            placeholder={normalize(app.definition.name)}
            preprocess={(value) => normalize(value)}
            required
          />
          <SimpleFormField
            help={
              <FormattedMessage
                {...messages.domainDescription}
                values={{
                  documentation: (
                    <Link rel="noopener noreferrer" target="_blank" to={`${lang}/docs/dns`}>
                      <FormattedMessage {...messages.documentation} />
                    </Link>
                  ),
                }}
              />
            }
            label={<FormattedMessage {...messages.domain} />}
            name="domain"
            pattern={domainPattern}
            preprocess={preprocessDomain}
            validityMessages={{
              patternMismatch: <FormattedMessage {...messages.domainError} />,
            }}
          />
          <FormButtons>
            <SimpleSubmit color="primary" type="submit">
              <FormattedMessage {...messages.saveChanges} />
            </SimpleSubmit>
          </FormButtons>
        </SimpleForm>
      </Content>
      <hr />
      <Content>
        <Message
          className={styles.dangerZone}
          color="danger"
          header={<FormattedMessage {...messages.dangerZone} />}
        >
          <p className="content">
            <FormattedMessage {...messages.deleteHelp} />
          </p>
          <Button color="danger" icon="trash-alt" onClick={onDelete}>
            <FormattedMessage {...messages.delete} />
          </Button>
        </Message>
      </Content>
    </>
  );
}
