import {
  Button,
  Checkbox,
  Content,
  FileUpload,
  Form,
  FormButtons,
  Input,
  Message,
  useConfirmation,
  useMessages,
  useObjectURL,
} from '@appsemble/react-components';
import { normalize } from '@appsemble/utils';
import axios from 'axios';
import React, { ReactText, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';

import { useApp } from '../AppContext';
import styles from './index.css';
import messages from './messages';

export default function AppSettings(): React.ReactElement {
  const { app } = useApp();
  const { formatMessage } = useIntl();
  const [icon, setIcon] = useState<File>();
  const [inputs, setInputs] = useState(app);

  const push = useMessages();
  const iconUrl = useObjectURL(icon || app.iconUrl);
  const history = useHistory();

  const onSubmit = async (): Promise<void> => {
    const data = new FormData();

    if (app.domain !== inputs.domain) {
      data.set('domain', inputs.domain);
    }

    if (app.path !== inputs.path) {
      data.set('path', inputs.path);
    }

    if (app.private !== inputs.private) {
      data.set('private', String(inputs.private));
    }

    if (icon) {
      data.set('icon', icon);
    }

    try {
      await axios.patch(`/api/apps/${app.id}`, data);
      push({ color: 'success', body: formatMessage(messages.updateSuccess) });
    } catch (ex) {
      push({ color: 'danger', body: formatMessage(messages.updateError) });
    }
  };

  const onChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, value: ReactText | boolean) => {
      event.persist();
      setInputs((val) => ({ ...val, [event.target.name]: value }));
    },
    [],
  );

  const onIconChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setIcon(e.target.files[0]);
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
      } catch (e) {
        push(formatMessage(messages.errorDelete));
      }
    },
  });

  return (
    <>
      <Content>
        <Form onSubmit={onSubmit}>
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
          <div className="mb-3">
            <Checkbox
              className="is-marginless"
              help={<FormattedMessage {...messages.private} />}
              label={<FormattedMessage {...messages.privateLabel} />}
              name="private"
              onChange={onChange}
              value={inputs.private}
              wrapperClassName="mb-0"
            />
            <p className="help">
              <FormattedMessage {...messages.privateDescription} />
            </p>
          </div>
          <Input
            help={
              <>
                <FormattedMessage {...messages.pathDescription} />
                <br />
                {`${window.location.protocol}//${inputs.path}.${app.OrganizationId}.${window.location.host}`}
              </>
            }
            label={<FormattedMessage {...messages.path} />}
            maxLength={30}
            name="path"
            onChange={onChange}
            placeholder={normalize(app.definition.name)}
            required
            value={inputs.path}
          />
          <Input
            help={
              <FormattedMessage
                {...messages.domainDescription}
                values={{
                  documentation: (
                    <a href="https://appsemble.dev/dns" rel="noopener noreferrer" target="_blank">
                      <FormattedMessage {...messages.documentation} />
                    </a>
                  ),
                }}
              />
            }
            label={<FormattedMessage {...messages.domain} />}
            name="domain"
            onChange={onChange}
            type="url"
            value={inputs.domain}
          />
          <FormButtons>
            <Button color="primary" type="submit">
              <FormattedMessage {...messages.saveChanges} />
            </Button>
          </FormButtons>
        </Form>
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
