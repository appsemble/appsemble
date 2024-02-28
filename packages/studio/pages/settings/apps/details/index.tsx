import {
  AsyncButton,
  Button,
  FileUpload,
  FormButtons,
  Icon,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  Subtitle,
  Title,
  useConfirmation,
  useData,
  useMessages,
  useMeta,
} from '@appsemble/react-components';
import { type AppAccount } from '@appsemble/types';
import axios from 'axios';
import { Fragment, type ReactNode, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { PicturePreview } from './PicturePreview/index.js';
import { AppIcon } from '../../../../components/AppIcon/index.js';
import { AsyncDataView } from '../../../../components/AsyncDataView/index.js';
import { CardHeaderControl } from '../../../../components/CardHeaderControl/index.js';
import { useUser } from '../../../../components/UserProvider/index.js';

export function DetailsPage(): ReactNode {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const result = useData<AppAccount>(`/api/user/apps/${appId}/account`);
  const { userInfo } = useUser();
  const push = useMessages();
  const { formatMessage } = useIntl();
  useMeta(result.data?.app?.messages?.app?.name ?? result.data?.app?.definition.name ?? appId);

  const onDelete = useConfirmation({
    body: <FormattedMessage {...messages.deleteBody} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    title: <FormattedMessage {...messages.deleteTitle} />,
    confirmLabel: <FormattedMessage {...messages.delete} />,
    color: 'danger',
    async action() {
      try {
        await axios.delete(`/api/apps/${appId}/members/${userInfo.sub}`);
        push({ body: formatMessage(messages.deleteSuccess), color: 'success' });
        navigate('.', { replace: true });
      } catch {
        push(formatMessage(messages.deleteError));
      }
    },
  });

  const onSubmit = useCallback(
    async ({ email, name, picture }: AppAccount) => {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);

      if (picture) {
        formData.append('picture', picture);
      }

      const { data } = await axios.patch<AppAccount>(`/api/user/apps/${appId}/account`, formData);
      result.setData(data);
    },
    [appId, result],
  );

  return (
    <AsyncDataView
      emptyMessage={<FormattedMessage {...messages.empty} />}
      errorMessage={<FormattedMessage {...messages.error} />}
      loadingMessage={<FormattedMessage {...messages.loading} />}
      result={result}
    >
      {({ app, sso, ...rest }) => (
        <CardHeaderControl
          controls={
            <>
              <Button
                className="mb-3 ml-4"
                color="primary"
                component={Link}
                to={`../../../apps/${appId}`}
              >
                <FormattedMessage {...messages.storePage} />
              </Button>
              <AsyncButton className="mb-3 ml-4" color="danger" onClick={onDelete}>
                <FormattedMessage {...messages.delete} />
              </AsyncButton>
            </>
          }
          description={app.messages?.app?.description || app.definition.description}
          icon={<AppIcon app={app} />}
          subtitle={
            <Link to={`../../../organizations/${app.OrganizationId}`}>
              {app.OrganizationName || app.OrganizationId}
            </Link>
          }
          title={app.messages?.app?.name || app.definition.name}
        >
          <SimpleForm className="card-content" defaultValues={rest} onSubmit={onSubmit}>
            <SimpleFormError>
              {() => <FormattedMessage {...messages.submitError} />}
            </SimpleFormError>
            <SimpleFormField
              help={
                app.messages?.app?.[`app,roles.${rest.role}.description`] || (
                  <FormattedMessage {...messages.roleHelp} />
                )
              }
              label={<FormattedMessage {...messages.roleLabel} />}
              name="role"
              readOnly
              required
            />
            <SimpleFormField
              help={<FormattedMessage {...messages.nameHelp} />}
              label={<FormattedMessage {...messages.nameLabel} />}
              name="name"
              required
              validityMessages={{
                valueMissing: <FormattedMessage {...messages.nameRequired} />,
              }}
            />
            <SimpleFormField
              help={<FormattedMessage {...messages.emailHelp} />}
              label={<FormattedMessage {...messages.emailLabel} />}
              name="email"
              required
              type="email"
              validityMessages={{
                typeMismatch: <FormattedMessage {...messages.emailInvalid} />,
                valueMissing: <FormattedMessage {...messages.emailRequired} />,
              }}
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
                <FormattedMessage {...messages.submit} />
              </SimpleSubmit>
            </FormButtons>
          </SimpleForm>
          {sso.length ? (
            <div className="card-content">
              <Title size={4}>
                <FormattedMessage {...messages.ssoTitle} />
              </Title>
              {sso.map(({ icon, name, url }, index) => (
                <Fragment key={url}>
                  {index ? <hr /> : null}
                  <div className="is-flex">
                    <Icon icon={icon} size="large" />
                    <div>
                      <Title size={5}>{name}</Title>
                      <Subtitle size={6}>
                        <a href={url}>{new URL(url).origin}</a>
                      </Subtitle>
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
          ) : null}
        </CardHeaderControl>
      )}
    </AsyncDataView>
  );
}
