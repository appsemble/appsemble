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
  TextAreaField,
  useConfirmation,
  useMessages,
  useMeta,
} from '@appsemble/react-components';
import { App, SSLStatus } from '@appsemble/types';
import { domainPattern, googleAnalyticsIDPattern, normalize, toUpperCase } from '@appsemble/utils';
import axios from 'axios';
import { ReactElement, useMemo } from 'react';
import { FormattedMessage, MessageDescriptor, useIntl } from 'react-intl';
import { Link, useHistory, useParams } from 'react-router-dom';

import { useApp } from '..';
import { useSSLStatus } from '../../../../components/useSSLStatus';
import { IconTool } from './IconTool';
import styles from './index.module.css';
import { messages } from './messages';
import { FormValues } from './types';

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
export function SettingsPage(): ReactElement {
  useMeta(messages.title);

  const { app, setApp } = useApp();
  const { formatMessage } = useIntl();

  const push = useMessages();
  const history = useHistory();
  const { lang } = useParams<{ lang: string }>();

  const pathDomain = `${app.path}.${app.OrganizationId}.${window.location.hostname}`;
  const domains = [pathDomain];
  if (app.domain) {
    domains.push(app.domain);
  }

  const sslStatus = useSSLStatus(...domains);

  // This is needed, because the app domain may be null.
  const defaultValues = useMemo<FormValues>(
    () => ({
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
      longDescription: app.longDescription || '',
      showAppDefinition: app.showAppDefinition,
    }),
    [app],
  );

  const onSubmit = async (values: FormValues): Promise<void> => {
    const form = new FormData();
    form.set('domain', values.domain);
    form.set('googleAnalyticsID', values.googleAnalyticsID);
    form.set('sentryDsn', values.sentryDsn);
    form.set('sentryEnvironment', values.sentryEnvironment);
    form.set('path', values.path);
    form.set('visibility', values.visibility);
    form.set('iconBackground', values.iconBackground);
    form.set('longDescription', values.longDescription);
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
        history.push('/apps');
      } catch {
        push(formatMessage(messages.errorDelete));
      }
    },
  });

  const onToggleLock = useConfirmation({
    title: <FormattedMessage {...(app.locked ? messages.unlockApp : messages.lockApp)} />,
    body: (
      <FormattedMessage
        {...(app.locked ? messages.unlockAppDescription : messages.lockAppDescription)}
      />
    ),
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...(app.locked ? messages.unlockApp : messages.lockApp)} />,
    color: 'warning',
    async action() {
      const { id, locked } = app;
      try {
        await axios.post(`/api/apps/${id}/lock`, { locked: !locked });
        setApp({ ...app, locked: !locked });
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
          <IconTool disabled={app.locked} />
          <SimpleFormField
            component={TextAreaField}
            disabled={app.locked}
            help={<FormattedMessage {...messages.longDescriptionDescription} />}
            label={<FormattedMessage {...messages.longDescription} />}
            name="longDescription"
          />
          <SimpleFormField
            component={SelectField}
            disabled={app.locked}
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
            disabled={app.locked}
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
            disabled={app.locked}
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
            disabled={app.locked}
            help={
              <FormattedMessage
                {...messages.domainDescription}
                values={{
                  link: (link: string) => (
                    <Link rel="noopener noreferrer" target="_blank" to={`/${lang}/docs/guide/dns`}>
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
            disabled={app.locked}
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
            disabled={app.locked}
            help={<FormattedMessage {...messages.sentryDsnDescription} />}
            label={<FormattedMessage {...messages.sentryDsnLabel} />}
            name="sentryDsn"
            type="url"
          />
          <SimpleFormField
            disabled={app.locked}
            help={<FormattedMessage {...messages.sentryEnvironmentDescription} />}
            label={<FormattedMessage {...messages.sentryEnvironmentLabel} />}
            name="sentryEnvironment"
          />
          <FormButtons>
            <SimpleSubmit color="primary" disabled={app.locked} type="submit">
              <FormattedMessage {...messages.saveChanges} />
            </SimpleSubmit>
          </FormButtons>
        </SimpleForm>
      </Content>
      <hr />
      <Content>
        <Message
          className={styles.appLock}
          color="warning"
          header={<FormattedMessage {...messages.appLock} />}
        >
          <p className="content">
            <FormattedMessage {...messages.lockedDescription} />
          </p>
          <Button color="warning" icon={app.locked ? 'unlock' : 'lock'} onClick={onToggleLock}>
            <FormattedMessage {...(app.locked ? messages.unlockApp : messages.lockApp)} />
          </Button>
        </Message>
        <Message
          className={styles.dangerZone}
          color="danger"
          header={<FormattedMessage {...messages.dangerZone} />}
        >
          <p className="content">
            <FormattedMessage {...messages.deleteHelp} />
          </p>
          <Button color="danger" disabled={app.locked} icon="trash-alt" onClick={onDelete}>
            <FormattedMessage {...messages.delete} />
          </Button>
        </Message>
      </Content>
    </>
  );
}
