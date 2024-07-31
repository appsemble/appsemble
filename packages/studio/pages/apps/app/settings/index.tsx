import {
  Button,
  CheckboxField,
  Content,
  FormButtons,
  Message,
  SelectField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  useConfirmation,
  useMessages,
  useMeta,
} from '@appsemble/react-components';
import { type App, type SSLStatus } from '@appsemble/types';
import { domainPattern, googleAnalyticsIDPattern, normalize, toUpperCase } from '@appsemble/utils';
import axios from 'axios';
import { type ReactNode, useMemo } from 'react';
import { FormattedMessage, type MessageDescriptor, useIntl } from 'react-intl';
import { Link, useNavigate } from 'react-router-dom';

import { IconTool } from './IconTool/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { type FormValues } from './types.js';
import { useSSLStatus } from '../../../../components/useSSLStatus.js';
import { useApp } from '../index.js';

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

/**
 * Render the app settings view.
 */
export function SettingsPage(): ReactNode {
  useMeta(messages.title);

  const { app, setApp } = useApp();
  const { formatMessage } = useIntl();

  const push = useMessages();
  const navigate = useNavigate();

  const pathDomain = `${app.path}.${app.OrganizationId}.${window.location.hostname}`;
  const domains = [pathDomain];
  if (app.domain) {
    domains.push(app.domain);
  }

  const sslStatus = useSSLStatus(...domains);

  // This is needed, because the app domain may be null.
  const defaultValues = useMemo<FormValues>(
    () => ({
      emailName: app.emailName || '',
      maskableIcon: null,
      domain: app.domain || '',
      googleAnalyticsID: app.googleAnalyticsID || '',
      sentryDsn: app.sentryDsn || '',
      sentryEnvironment: app.sentryEnvironment || '',
      icon: null,
      iconBackground: app.iconBackground,
      path: app.path,
      visibility: app.visibility,
      locked: app.locked,
      showAppDefinition: app.showAppDefinition,
    }),
    [app],
  );

  const onSubmit = async (values: FormValues): Promise<void> => {
    const form = new FormData();
    form.set('emailName', values.emailName);
    form.set('domain', values.domain);
    form.set('googleAnalyticsID', values.googleAnalyticsID);
    form.set('sentryDsn', values.sentryDsn);
    form.set('sentryEnvironment', values.sentryEnvironment);
    form.set('path', values.path);
    form.set('visibility', values.visibility);
    form.set('iconBackground', values.iconBackground);
    form.set('showAppDefinition', String(values.showAppDefinition));
    if (values.icon !== app.iconUrl) {
      form.set('icon', values.icon);
    }
    if (values.maskableIcon) {
      form.set('maskableIcon', values.maskableIcon);
    }

    const { data } = await axios.patch<App>(`/api/apps/${app.id}`, form);
    push({ color: 'success', body: formatMessage(messages.updateSuccess) });
    setApp(data);
  };

  const onDelete = useConfirmation({
    title: <FormattedMessage {...messages.deleteWarningTitle} />,
    body: <FormattedMessage {...messages.deleteWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.delete} />,
    async action() {
      const { id } = app;

      try {
        await axios.delete(`/api/apps/${id}`);
        push({
          body: formatMessage(messages.deleteSuccess, {
            name: app.definition.name,
          }),
          color: 'info',
        });
        navigate('/apps');
      } catch {
        push(formatMessage(messages.errorDelete));
      }
    },
  });

  const onToggleLock = useConfirmation({
    title: (
      <FormattedMessage
        {...(app.locked === 'studioLock' ? messages.unlockApp : messages.lockApp)}
      />
    ),
    body: (
      <FormattedMessage
        {...(app.locked === 'studioLock'
          ? messages.unlockAppDescription
          : messages.lockAppDescription)}
      />
    ),
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: (
      <FormattedMessage
        {...(app.locked === 'studioLock' ? messages.unlockApp : messages.lockApp)}
      />
    ),
    color: 'warning',
    async action() {
      const { id, locked } = app;
      try {
        const lockedValue = locked === 'studioLock' ? 'unlocked' : 'studioLock';
        await axios.post(`/api/apps/${id}/lock`, { locked: lockedValue });
        setApp({ ...app, locked: lockedValue });
        push({
          body: formatMessage(locked ? messages.unlockedSuccessfully : messages.lockedSuccessfully),
          color: 'info',
        });
      } catch {
        push(formatMessage(messages.lockError));
      }
    },
  });

  return (
    <>
      <Content fullwidth>
        <SimpleForm defaultValues={defaultValues} onSubmit={onSubmit}>
          <SimpleFormError>{() => <FormattedMessage {...messages.updateError} />}</SimpleFormError>
          <IconTool disabled={app.locked !== 'unlocked'} />
          <SimpleFormField
            component={SelectField}
            disabled={app.locked !== 'unlocked'}
            help={<FormattedMessage {...messages.visibilityDescription} />}
            label={<FormattedMessage {...messages.visibilityLabel} />}
            name="visibility"
          >
            <option value="public">{formatMessage(messages.public)}</option>
            <option value="unlisted">{formatMessage(messages.unlisted)}</option>
            <option value="private">{formatMessage(messages.private)}</option>
          </SimpleFormField>
          <SimpleFormField
            component={CheckboxField}
            disabled={app.locked !== 'unlocked'}
            help={<FormattedMessage {...messages.showAppDefinitionDescription} />}
            label={<FormattedMessage {...messages.showAppDefinitionLabel} />}
            name="showAppDefinition"
          />
          <SimpleFormField
            addonLeft={
              <Button
                className={`is-light ${
                  sslStatus
                    ? sslStatus[pathDomain] === 'ready'
                      ? 'is-success'
                      : 'is-danger'
                    : 'is-loading'
                }`}
                component="label"
                htmlFor="path"
                title={formatMessage(getSSLMessage(sslStatus?.[pathDomain]))}
              >
                {`${window.location.protocol}//`}
              </Button>
            }
            addonRight={
              <Button className="is-light" component="label" htmlFor="path">
                {`.${app.OrganizationId}.${window.location.host}`}
              </Button>
            }
            disabled={app.locked !== 'unlocked'}
            help={<FormattedMessage {...messages.pathDescription} />}
            label={<FormattedMessage {...messages.path} />}
            maxLength={30}
            name="path"
            placeholder={normalize(app.definition.name)}
            preprocess={(value) => normalize(value)}
            required
          />
          <SimpleFormField
            addonLeft={
              <Button
                className={`is-light ${
                  sslStatus
                    ? sslStatus[app.domain] === 'ready'
                      ? 'is-success'
                      : 'is-danger'
                    : 'is-loading'
                }`}
                component="label"
                htmlFor="domain"
                title={formatMessage(getSSLMessage(sslStatus?.[app.domain]))}
              >
                {`${window.location.protocol}//`}
              </Button>
            }
            disabled={app.locked !== 'unlocked'}
            help={
              <FormattedMessage
                {...messages.domainDescription}
                values={{
                  link: (link) => (
                    <Link rel="noopener noreferrer" target="_blank" to="../../../docs/guides/dns">
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
          <SimpleFormField
            disabled={app.locked !== 'unlocked'}
            help={<FormattedMessage {...messages.emailNameDescription} />}
            label={<FormattedMessage {...messages.emailNameLabel} />}
            maxLength={30}
            name="emailName"
            placeholder="Appsemble"
          />
          <SimpleFormField
            disabled={app.locked !== 'unlocked'}
            help={<FormattedMessage {...messages.googleAnalyticsIDDescription} />}
            label={<FormattedMessage {...messages.googleAnalyticsIDLabel} />}
            maxLength={15}
            name="googleAnalyticsID"
            pattern={googleAnalyticsIDPattern}
            preprocess={toUpperCase}
            validityMessages={{
              patternMismatch: <FormattedMessage {...messages.googleAnalyticsError} />,
            }}
          />
          <SimpleFormField
            disabled={app.locked !== 'unlocked'}
            help={<FormattedMessage {...messages.sentryDsnDescription} />}
            label={<FormattedMessage {...messages.sentryDsnLabel} />}
            name="sentryDsn"
            type="url"
          />
          <SimpleFormField
            disabled={app.locked !== 'unlocked'}
            help={<FormattedMessage {...messages.sentryEnvironmentDescription} />}
            label={<FormattedMessage {...messages.sentryEnvironmentLabel} />}
            name="sentryEnvironment"
          />
          <FormButtons>
            <SimpleSubmit color="primary" disabled={app.locked !== 'unlocked'} type="submit">
              <FormattedMessage {...messages.saveChanges} />
            </SimpleSubmit>
          </FormButtons>
        </SimpleForm>
      </Content>
      <hr />
      <Content>
        {app.locked === 'fullLock' ? null : (
          <Message
            className={styles.appLock}
            color="warning"
            header={<FormattedMessage {...messages.appLock} />}
          >
            <p className="content">
              <FormattedMessage {...messages.lockedDescription} />
            </p>
            <Button
              color="warning"
              icon={app.locked === 'studioLock' ? 'unlock' : 'lock'}
              onClick={onToggleLock}
            >
              <FormattedMessage
                {...(app.locked === 'studioLock' ? messages.unlockApp : messages.lockApp)}
              />
            </Button>
          </Message>
        )}
        <Message
          className={styles.dangerZone}
          color="danger"
          header={<FormattedMessage {...messages.dangerZone} />}
        >
          <p className="content">
            <FormattedMessage {...messages.deleteHelp} />
          </p>
          <Button
            color="danger"
            disabled={app.locked !== 'unlocked'}
            icon="trash-alt"
            onClick={onDelete}
          >
            <FormattedMessage {...messages.delete} />
          </Button>
        </Message>
      </Content>
    </>
  );
}
