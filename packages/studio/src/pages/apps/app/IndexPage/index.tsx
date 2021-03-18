import {
  Button,
  CardFooterButton,
  CheckboxField,
  Content,
  MarkdownContent,
  ModalCard,
  SelectField,
  SimpleForm,
  SimpleFormField,
  Title,
  useData,
  useToggle,
} from '@appsemble/react-components';
import { Organization } from '@appsemble/types';
import { defaultLocale, Permission } from '@appsemble/utils';
import axios from 'axios';
import classNames from 'classnames';
import { ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useHistory, useParams } from 'react-router-dom';

import { useApp } from '..';
import { CardHeaderControl } from '../../../../components/CardHeaderControl';
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
  const { data: organization, error, loading } = useData<Organization>(
    `/api/organizations/${app.OrganizationId}`,
  );
  const cloneDialog = useToggle();
  const descriptionToggle = useToggle();
  const history = useHistory();
  const { lang } = useParams<{ lang: string }>();
  const { formatMessage } = useIntl();
  const { organizations } = useUser();

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
            {createOrganizations.length > 0 && (
              <>
                <Button className="mb-3 ml-4" onClick={cloneDialog.enable}>
                  <FormattedMessage {...messages.clone} />
                </Button>
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
                    <>
                      <CardFooterButton onClick={cloneDialog.disable}>
                        <FormattedMessage {...messages.cancel} />
                      </CardFooterButton>
                      <CardFooterButton color="primary" type="submit">
                        <FormattedMessage {...messages.submit} />
                      </CardFooterButton>
                    </>
                  }
                  isActive={cloneDialog.enabled}
                  onClose={cloneDialog.disable}
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
                    disabled={organizations.length === 1}
                    label={<FormattedMessage {...messages.organization} />}
                    name="selectedOrganization"
                    required
                  >
                    {organizations.map((org, index) => (
                      <option key={org.id} value={index}>
                        {org.name ?? org.id}
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
              </>
            )}
          </>
        }
        description={app.definition.description}
        details={
          <StarRating className="is-inline" count={app.rating.count} value={app.rating.average} />
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
            {loading || error ? `@${app.OrganizationId}` : organization.name}
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
