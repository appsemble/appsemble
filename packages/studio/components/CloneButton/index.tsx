import {
  Box,
  Button,
  CardFooterButton,
  CheckboxField,
  Modal,
  ModalCard,
  SelectField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  useLocationString,
} from '@appsemble/react-components';
import { type App, OrganizationPermission, type Template } from '@appsemble/types';
import { checkOrganizationRoleOrganizationPermissions } from '@appsemble/utils';
import axios from 'axios';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { CreateOrganizationModal } from '../CreateOrganizationModal/index.js';
import { ResendEmailButton } from '../ResendEmailButton/index.js';
import { useUser } from '../UserProvider/index.js';

interface CloneButtonProps {
  /**
   * The app to clone.
   */
  readonly app: App;
}

/**
 * Display a more detailed overview of an individual app.
 */
export function CloneButton({ app }: CloneButtonProps): ReactNode {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const { lang } = useParams<{ lang: string }>();
  const redirect = useLocationString();
  const { hash } = useLocation();
  const { organizations, userInfo } = useUser();
  const [hasClonableResources, setHasClonableResources] = useState<boolean>(false);
  const [hasClonableAssets, setHasClonableAssets] = useState<boolean>(false);

  const createOrganizations =
    organizations?.filter((org) =>
      checkOrganizationRoleOrganizationPermissions(org.role, [OrganizationPermission.CreateApps]),
    ) ?? [];
  const organizationId = createOrganizations[0]?.id;

  const defaultValues = useMemo<Template>(
    () => ({
      templateId: app.id,
      name: app.definition.name,
      description: app.definition.description,
      organizationId,
      visibility: 'unlisted',
      resources: false,
      assets: false,
    }),
    [app, organizationId],
  );

  useEffect(() => {
    (async () => {
      const resourcesResult = await axios.get(`/api/apps/${app.id}/clonable-resources`);
      setHasClonableResources(resourcesResult.data);
      const assetsResult = await axios.get(`/api/apps/${app.id}/clonable-assets`);
      setHasClonableAssets(assetsResult.data);
    })();
  }, [app.id]);

  const cloneApp = useCallback(
    async (values: Template) => {
      const { data } = await axios.post<App>('/api/app-templates', values);

      navigate(`/apps/${data.id}/edit#editor`);
    },
    [navigate],
  );

  const openCloneDialog = useCallback(() => {
    navigate({ hash: 'clone' }, { replace: true });
  }, [navigate]);

  const closeCloneDialog = useCallback(() => {
    navigate({ hash: null }, { replace: true });
  }, [navigate]);

  // YAML is not included if app.showAppDefinition is true and the user doesn’t have permissions.
  if (!app.yaml) {
    return null;
  }

  return (
    <>
      <Button className="mb-3 ml-4" onClick={openCloneDialog}>
        <FormattedMessage {...messages.clone} />
      </Button>
      {userInfo ? (
        createOrganizations?.length ? (
          <ModalCard
            component={SimpleForm}
            defaultValues={defaultValues}
            footer={
              userInfo && createOrganizations?.length ? (
                <>
                  <CardFooterButton onClick={closeCloneDialog}>
                    <FormattedMessage {...messages.cancel} />
                  </CardFooterButton>
                  <CardFooterButton color="primary" type="submit">
                    <FormattedMessage {...messages.submit} />
                  </CardFooterButton>
                </>
              ) : null
            }
            isActive={hash === '#clone'}
            onClose={closeCloneDialog}
            onSubmit={cloneApp}
            title={<FormattedMessage {...messages.clone} />}
          >
            <SimpleFormError>{() => <FormattedMessage {...messages.error} />}</SimpleFormError>
            <SimpleFormField
              help={<FormattedMessage {...messages.nameDescription} />}
              label={<FormattedMessage {...messages.name} />}
              maxLength={30}
              name="name"
              required
            />
            <SimpleFormField
              component={SelectField}
              disabled={organizations.length <= 1}
              label={<FormattedMessage {...messages.organization} />}
              name="organizationId"
              required
            >
              {createOrganizations?.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name || org.id}
                </option>
              ))}
            </SimpleFormField>
            <SimpleFormField
              help={<FormattedMessage {...messages.descriptionDescription} />}
              label={<FormattedMessage {...messages.description} />}
              maxLength={80}
              name="description"
            />
            <SimpleFormField
              component={SelectField}
              help={<FormattedMessage {...messages.visibilityDescription} />}
              label={<FormattedMessage {...messages.visibilityLabel} />}
              name="visibility"
            >
              <option value="public">{formatMessage(messages.public)}</option>
              <option value="unlisted">{formatMessage(messages.unlisted)}</option>
              <option value="private">{formatMessage(messages.private)}</option>
            </SimpleFormField>
            {hasClonableResources ? (
              <SimpleFormField
                component={CheckboxField}
                label={<FormattedMessage {...messages.resources} />}
                name="resources"
                title={<FormattedMessage {...messages.resourcesDescription} />}
              />
            ) : null}
            {hasClonableAssets ? (
              <SimpleFormField
                component={CheckboxField}
                label={<FormattedMessage {...messages.assets} />}
                name="assets"
                title={<FormattedMessage {...messages.assetsDescription} />}
              />
            ) : null}
            <SimpleFormField
              component={CheckboxField}
              label={<FormattedMessage {...messages.variables} />}
              name="variables"
              title={<FormattedMessage {...messages.variablesDescription} />}
            />
            <SimpleFormField
              component={CheckboxField}
              label={<FormattedMessage {...messages.secrets} />}
              name="secrets"
              title={<FormattedMessage {...messages.secretsDescription} />}
            />
          </ModalCard>
        ) : (
          <CreateOrganizationModal
            disabled={!userInfo.email_verified}
            help={
              <div className="mb-4">
                <span>
                  <FormattedMessage {...messages.cloneOrganizationInstructions} />
                </span>
                {userInfo.email_verified ? null : (
                  <div className="is-flex is-flex-direction-column is-align-items-center">
                    <span className="my-2">
                      <FormattedMessage {...messages.cloneVerifyMessage} />
                    </span>
                    <ResendEmailButton className="is-outlined" email={userInfo.email} />
                  </div>
                )}
              </div>
            }
            isActive={hash === '#clone'}
            onClose={closeCloneDialog}
            title={<FormattedMessage {...messages.clone} />}
          />
        )
      ) : (
        <Modal isActive={hash === '#clone'} onClose={closeCloneDialog}>
          <Box>
            <FormattedMessage
              {...messages.cloneLoginMessage}
              values={{
                loginLink: (content) => (
                  <Link to={`/${lang}/login?${new URLSearchParams({ redirect })}`}>{content}</Link>
                ),
                registerLink: (content) => (
                  <Link to={`/${lang}/register?${new URLSearchParams({ redirect })}`}>
                    {content}
                  </Link>
                ),
              }}
            />
          </Box>
        </Modal>
      )}
    </>
  );
}
