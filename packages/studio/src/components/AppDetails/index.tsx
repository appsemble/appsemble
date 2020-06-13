import {
  Button,
  CardFooterButton,
  Checkbox,
  Loader,
  Modal,
  Select,
  SimpleForm,
  SimpleInput,
  Title,
  useMessages,
} from '@appsemble/react-components';
import type { Organization, Rating } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';

import useOrganizations from '../../hooks/useOrganizations';
import useUser from '../../hooks/useUser';
import checkRole from '../../utils/checkRole';
import { useApp } from '../AppContext';
import RateApp from '../RateApp';
import StarRating from '../Rating';
import styles from './index.css';
import messages from './messages';

export default function AppDetails(): React.ReactElement {
  const { app } = useApp();
  const [organization, setOrganization] = useState<Organization>(undefined);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const history = useHistory();
  const intl = useIntl();

  const organizations = useOrganizations();
  const push = useMessages();
  const { userInfo } = useUser();

  useEffect(() => {
    const fetchOrganization = async (): Promise<void> => {
      const { data } = await axios.get<Organization>(`/api/organizations/${app.OrganizationId}`);
      setOrganization(data);
    };
    fetchOrganization();
  }, [app.OrganizationId]);

  useEffect(() => {
    const fetchRatings = async (): Promise<void> => {
      const { data } = await axios.get<Rating[]>(`/api/apps/${app.id}/ratings`);
      setRatings(data);
    };

    fetchRatings();
  }, [app.OrganizationId, app.id]);

  const onRate = (rating: Rating): void => {
    const existingRating = ratings.find((r) => r.UserId === rating.UserId);

    if (existingRating) {
      setRatings(ratings.map((r) => (r.UserId === rating.UserId ? rating : r)));
    } else {
      setRatings([rating, ...ratings]);
    }
    push({ color: 'success', body: intl.formatMessage(messages.ratingSuccessful) });
  };

  const closeDialog = (): void => setShowCloneDialog(false);
  const showDialog = (): void => setShowCloneDialog(true);
  const cloneApp = React.useCallback(
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
    [app.id, history, organizations],
  );

  if (!organization) {
    return <Loader />;
  }

  const createOrganizations =
    organizations?.filter((org) => checkRole(org.role, Permission.CreateApps)) || [];

  return (
    <>
      <div className="content">
        <div className={styles.titleContainer}>
          <div className={styles.title}>
            <figure className="image is-64x64 is-marginless">
              <img alt={intl.formatMessage(messages.appLogo)} src={`/api/apps/${app.id}/icon`} />
            </figure>
            <div className="is-block">
              <h1 className="is-marginless">{app.definition.name}</h1>
              <h3 className="is-marginless">{organization.name}</h3>
            </div>
          </div>
          <div>
            {createOrganizations.length ? (
              <Button className={`${styles.cloneButton}`} onClick={showDialog}>
                <FormattedMessage {...messages.clone} />
              </Button>
            ) : null}
            <a
              className="button is-primary"
              href={
                app.domain
                  ? `//${app.domain}${window.location.port && `:${window.location.port}`}`
                  : `//${app.path}.${app.OrganizationId}.${window.location.host}`
              }
              rel="noopener noreferrer"
              target="_blank"
            >
              <FormattedMessage {...messages.view} />
            </a>
          </div>
        </div>
        {app.definition.description && (
          <blockquote className={styles.description}>{app.definition.description}</blockquote>
        )}
        <Title>
          <FormattedMessage {...messages.ratings} />
        </Title>
      </div>
      {userInfo && <RateApp app={app} className={styles.ratingButton} onRate={onRate} />}
      <div className="content">
        {ratings.map((rating) => (
          <div key={rating.$created} className={styles.rating}>
            <span className="is-block has-text-weight-bold">
              {rating.name || <FormattedMessage {...messages.anonymous} />}
              {userInfo && rating.UserId === userInfo.sub && (
                <span className={`tag is-success ${styles.tag}`}>
                  <FormattedMessage {...messages.you} />
                </span>
              )}
            </span>
            <StarRating className="is-inline" value={rating.rating} />
            <span className="is-inline has-text-grey-light is-size-7">
              {new Date(rating.$updated).toLocaleString()}
            </span>
            {rating.description && (
              <blockquote className={styles.description}>{rating.description}</blockquote>
            )}
          </div>
        ))}
      </div>
      {createOrganizations.length ? (
        <Modal
          component={SimpleForm}
          defaultValues={{
            name: app.definition.name,
            description: app.definition.description,
            private: true,
            selectedOrganization: 0,
          }}
          footer={
            <>
              <CardFooterButton onClick={closeDialog}>
                <FormattedMessage {...messages.cancel} />
              </CardFooterButton>
              <CardFooterButton color="primary" type="submit">
                <FormattedMessage {...messages.submit} />
              </CardFooterButton>
            </>
          }
          isActive={showCloneDialog}
          onClose={closeDialog}
          onSubmit={cloneApp}
          title={<FormattedMessage {...messages.clone} />}
        >
          <SimpleInput
            help={<FormattedMessage {...messages.nameDescription} />}
            label={<FormattedMessage {...messages.name} />}
            maxLength={30}
            name="name"
            required
          />
          <SimpleInput<typeof Select>
            component={Select}
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
          </SimpleInput>
          <SimpleInput
            help={<FormattedMessage {...messages.descriptionDescription} />}
            label={<FormattedMessage {...messages.description} />}
            maxLength={80}
            name="description"
          />
          <SimpleInput<typeof Checkbox>
            component={Checkbox}
            help={<FormattedMessage {...messages.privateDescription} />}
            label={<FormattedMessage {...messages.private} />}
            name="private"
          />
        </Modal>
      ) : null}
    </>
  );
}
