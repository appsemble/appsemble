import {
  Button,
  CardFooterButton,
  Checkbox,
  Content,
  Form,
  FormButtons,
  FormComponent,
  Icon,
  Input,
  Message,
  Modal,
  useMessages,
  useObjectURL,
} from '@appsemble/react-components';
import { normalize } from '@appsemble/utils';
import axios from 'axios';
import React, { FormEvent, ReactText, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';

import { useApp } from '../AppContext';
import styles from './index.css';
import messages from './messages';

export default function AppSettings(): React.ReactElement {
  const { app } = useApp();
  const intl = useIntl();
  const [icon, setIcon] = useState<File>();
  const [inputs, setInputs] = useState(app);
  const [deleteDialog, setDeleteDialog] = React.useState(false);

  const push = useMessages();
  const iconUrl = useObjectURL(icon || app.iconUrl);
  const history = useHistory();

  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
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
      push({ color: 'success', body: intl.formatMessage(messages.updateSuccess) });
    } catch (ex) {
      push({ color: 'danger', body: intl.formatMessage(messages.updateError) });
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

  const onDelete = React.useCallback(async () => {
    const { OrganizationId, id, path } = app;

    try {
      await axios.delete(`/api/apps/${id}`);
      push({
        body: intl.formatMessage(messages.deleteSuccess, {
          name: `@${OrganizationId}/${path}`,
        }),
        color: 'info',
      });
      history.push('/apps');
    } catch (e) {
      push(intl.formatMessage(messages.errorDelete));
    }
  }, [app, history, intl, push]);

  const onDeleteClick = React.useCallback(() => setDeleteDialog(true), []);

  const onClose = React.useCallback(() => setDeleteDialog(false), []);

  return (
    <>
      <Content>
        <Form onSubmit={onSubmit}>
          <FormComponent id="icon-upload" label={<FormattedMessage {...messages.icon} />}>
            <figure className={`image is-128x128 ${styles.iconContainer}`}>
              <img alt={intl.formatMessage(messages.icon)} className={styles.icon} src={iconUrl} />
            </figure>
            <div className="file has-name">
              <label className="file-label" htmlFor="icon-upload">
                <input
                  accept="image/jpeg, image/png, image/tiff, image/webp"
                  className="file-input"
                  id="icon-upload"
                  name="icon"
                  onChange={onIconChange}
                  type="file"
                />
                <span className="file-cta">
                  <Icon icon="upload" />
                  <span className="file-label">
                    <FormattedMessage {...messages.icon} />
                  </span>
                </span>
                <span className="file-name">
                  {icon?.name || <FormattedMessage {...messages.noFile} />}
                </span>
              </label>
            </div>
            <p className="help">
              <FormattedMessage {...messages.iconDescription} />
            </p>
          </FormComponent>
          <div className={styles.private}>
            <Checkbox
              className="is-marginless"
              help={<FormattedMessage {...messages.private} />}
              label={<FormattedMessage {...messages.privateLabel} />}
              name="private"
              onChange={onChange}
              value={inputs.private}
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
                {window.location.protocol}//{inputs.path}.{app.OrganizationId}.
                {window.location.host}
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
        <Message color="danger" header={<FormattedMessage {...messages.dangerZone} />}>
          <p className="content">
            <FormattedMessage {...messages.deleteHelp} />
          </p>
          <Button color="danger" icon="trash-alt" onClick={onDeleteClick}>
            <FormattedMessage {...messages.delete} />
          </Button>
        </Message>
        <Modal
          footer={
            <>
              <CardFooterButton onClick={onClose}>
                <FormattedMessage {...messages.cancel} />
              </CardFooterButton>
              <CardFooterButton color="danger" onClick={onDelete}>
                <FormattedMessage {...messages.delete} />
              </CardFooterButton>
            </>
          }
          isActive={deleteDialog}
          onClose={onClose}
          title={<FormattedMessage {...messages.deleteWarningTitle} />}
        >
          <FormattedMessage {...messages.deleteWarning} />
        </Modal>
      </Content>
    </>
  );
}
