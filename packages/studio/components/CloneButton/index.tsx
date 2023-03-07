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
import { App, Template } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import axios from 'axios';
import { ReactElement, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { checkRole } from '../../utils/checkRole.js';
import { CreateOrganizationModal } from '../CreateOrganizationModal/index.js';
import { ResendEmailButton } from '../ResendEmailButton/index.js';
import { useUser } from '../UserProvider/index.js';
import { messages } from './messages.js';

interface CloneButtonProps {
  /**
   * The app to clone.
   */
  app: App;
}

/**
 * Display a more detailed overview of an individual app.
 */
export function CloneButton({ app }: CloneButtonProps): ReactElement {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const { lang } = useParams<{ lang: string }>();
  const redirect = useLocationString();
  const { hash } = useLocation();
  const { organizations, userInfo } = useUser();

  const createOrganizations =
    organizations?.filter((org) => checkRole(org.role, Permission.CreateApps)) ?? [];
  const organizationId = createOrganizations[0]?.id;

  const defaultValues = useMemo<Template>(
    () => ({
      templateId: app.id,
      name: app.definition.name,
      description: app.definition.description,
      organizationId,
      visibility: 'unlisted',
      resources: false,
    }),
    [app, organizationId],
  );

  const cloneApp = useCallback(
    async (values: Template) => {
      const { data } = await axios.post<App>('/api/templates', values);

      navigate(`/apps/${data.id}/edit`);
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
        createOrganizations.length ? (
          <ModalCard
            component={SimpleForm}
            defaultValues={defaultValues}
            footer={
              userInfo && createOrganizations.length ? (
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
              {createOrganizations.map((org) => (
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
            {app.resources ? (
              <SimpleFormField
                component={CheckboxField}
                label={<FormattedMessage {...messages.resources} />}
                name="resources"
                title={<FormattedMessage {...messages.resourcesDescription} />}
              />
            ) : null}
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
