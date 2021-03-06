import {
  Button,
  CheckboxField,
  Content,
  FormButtons,
  Message,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  TextAreaField,
  useConfirmation,
  useMessages,
  useMeta,
} from '@appsemble/react-components';
import { App } from '@appsemble/types';
import { domainPattern, normalize } from '@appsemble/utils';
import axios from 'axios';
import { ReactElement, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useHistory, useParams } from 'react-router-dom';

import { useApp } from '..';
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

  // This is needed, because the app domain may be null.
  const defaultValues = useMemo<FormValues>(
    () => ({
      maskableIcon: null,
      domain: app.domain || '',
      icon: null,
      iconBackground: app.iconBackground,
      path: app.path,
      private: app.private,
      locked: app.locked,
      longDescription: app.longDescription || '',
    }),
    [app],
  );

  const onSubmit = async (values: FormValues): Promise<void> => {
    const form = new FormData();
    form.set('domain', values.domain);
    form.set('path', values.path);
    form.set('private', String(values.private));
    form.set('iconBackground', values.iconBackground);
    form.set('longDescription', values.longDescription);
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
            component={CheckboxField}
            disabled={app.locked}
            help={<FormattedMessage {...messages.privateDescription} />}
            label={<FormattedMessage {...messages.privateLabel} />}
            name="private"
            title={<FormattedMessage {...messages.private} />}
          />
          <SimpleFormField
            addonRight={
              <Button className="is-static" component="span">
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
            disabled={app.locked}
            help={
              <FormattedMessage
                {...messages.domainDescription}
                values={{
                  link: (link: string) => (
                    <Link rel="noopener noreferrer" target="_blank" to={`/${lang}/docs/dns`}>
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
