import {
  Box,
  Button,
  CardFooterButton,
  CheckboxField,
  Content,
  MarkdownContent,
  Modal,
  ModalCard,
  SelectField,
  SimpleForm,
  SimpleFormField,
  Title,
  useLocationString,
  useToggle,
} from '@appsemble/react-components';
import { defaultLocale, Permission } from '@appsemble/utils';
import axios from 'axios';
import classNames from 'classnames';
import { ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useHistory, useLocation, useParams } from 'react-router-dom';

import { useApp } from '..';
import { CardHeaderControl } from '../../../../components/CardHeaderControl';
import { CreateOrganizationModal } from '../../../../components/CreateOrganizationModal';
import { ResendEmailButton } from '../../../../components/ResendEmailButton';
import { StarRating } from '../../../../components/StarRating';
import { useUser } from '../../../../components/UserProvider';
import { checkRole } from '../../../../utils/checkRole';
import { getAppUrl } from '../../../../utils/getAppUrl';
import { AppRatings } from './AppRatings';
import { AppScreenshots } from './AppScreenshots';
import styles from './index.module.css';
import { messages } from './messages';

/**
 * Display a more detailed overview of an individual app.
 */
export function IndexPage(): ReactElement {
  const { app } = useApp();
  const descriptionToggle = useToggle();
  const history = useHistory();
  const { hash } = useLocation();
  const { lang } = useParams<{ lang: string }>();
  const { formatMessage } = useIntl();
  const { organizations, userInfo } = useUser();
  const redirect = useLocationString();

  const cloneApp = useCallback(
    async ({ description, name, private: isPrivate, selectedOrganization }) => {
      const { data: clone } = await axios.post('/api/templates', {
        templateId: app.id,
        name,
        description,
        organizationId: organizations[selectedOrganization].id,
        resources: false,
        private: isPrivate,
      });

      history.push(`/apps/${clone.id}/edit`);
    },
    [app, history, organizations],
  );

  const openCloneDialog = useCallback(() => {
    history.push({ hash: 'clone' });
  }, [history]);

  const closeCloneDialog = useCallback(() => {
    history.push({ hash: null });
  }, [history]);

  const createOrganizations =
    organizations?.filter((org) => checkRole(org.role, Permission.CreateApps)) ?? [];

  const appLang = app.definition.defaultLanguage || defaultLocale;

  return (
    <Content className={styles.root}>
      <CardHeaderControl
        controls={
          <>
            <Button
              className="mb-3 ml-4"
              color="primary"
              component="a"
              href={getAppUrl(app.OrganizationId, app.path, app.domain)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <FormattedMessage {...messages.view} />
            </Button>
            <Button className="mb-3 ml-4" onClick={openCloneDialog}>
              <FormattedMessage {...messages.clone} />
            </Button>
            {userInfo ? (
              createOrganizations.length ? (
                <ModalCard
                  component={SimpleForm}
                  defaultValues={{
                    name: app.definition.name,
                    description: app.definition.description,
                    private: true,
                    selectedOrganization: 0,
                    resources: false,
                  }}
                  footer={
                    userInfo &&
                    createOrganizations.length && (
                      <>
                        <CardFooterButton onClick={closeCloneDialog}>
                          <FormattedMessage {...messages.cancel} />
                        </CardFooterButton>
                        <CardFooterButton color="primary" type="submit">
                          <FormattedMessage {...messages.submit} />
                        </CardFooterButton>
                      </>
                    )
                  }
                  isActive={hash === '#clone'}
                  onClose={closeCloneDialog}
                  onSubmit={cloneApp}
                  title={<FormattedMessage {...messages.clone} />}
                >
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
                    name="selectedOrganization"
                    required
                  >
                    {createOrganizations.map((org, index) => (
                      <option key={org.id} value={index}>
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
                    component={CheckboxField}
                    label={<FormattedMessage {...messages.private} />}
                    name="private"
                    title={<FormattedMessage {...messages.privateDescription} />}
                  />
                  {app.resources && (
                    <SimpleFormField
                      component={CheckboxField}
                      label={<FormattedMessage {...messages.resources} />}
                      name="resources"
                      title={<FormattedMessage {...messages.resourcesDescription} />}
                    />
                  )}
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
                      loginLink: (content: string) => (
                        <Link to={`/${lang}/login?${new URLSearchParams({ redirect })}`}>
                          {content}
                        </Link>
                      ),
                      registerLink: (content: string) => (
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
        }
        description={app.definition.description}
        details={
          <StarRating
            className="is-inline"
            count={app.rating?.count ?? 0}
            value={app.rating?.average ?? 0}
          />
        }
        icon={
          <img
            alt={formatMessage(messages.appLogo)}
            className="is-rounded card"
            src={`/api/apps/${app.id}/icon?maskable=true`}
          />
        }
        subtitle={
          <Link to={`/${lang}/organizations/@${app.OrganizationId}`}>
            {app.OrganizationName || app.OrganizationId}
          </Link>
        }
        title={app.definition.name}
      >
        <AppScreenshots />
      </CardHeaderControl>
      {app.longDescription && (
        <div
          className={classNames('card my-3 card-content', {
            [styles.descriptionHidden]: !descriptionToggle.enabled,
          })}
        >
          <Title>
            <FormattedMessage {...messages.description} />
          </Title>
          <Button className={styles.descriptionToggle} onClick={descriptionToggle.toggle}>
            {descriptionToggle.enabled ? (
              <FormattedMessage {...messages.readLess} />
            ) : (
              <FormattedMessage {...messages.readMore} />
            )}
          </Button>
          <MarkdownContent content={app.longDescription} lang={appLang} />
        </div>
      )}
      <AppRatings />
    </Content>
  );
}
