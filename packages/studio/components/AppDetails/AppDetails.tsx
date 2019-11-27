import { Loader } from '@appsemble/react-components';
import { App, Message } from '@appsemble/types';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { FormattedMessage, WrappedComponentProps } from 'react-intl';
import { RouteComponentProps } from 'react-router-dom';

import { User } from '../../types';
import RateApp from '../RateApp';
import Rating from '../Rating';
import styles from './AppDetails.css';
import messages from './messages';

export type AppDetailsProps = {
  app: App;
  user: User;
  push: (message: Message) => void;
} & WrappedComponentProps &
  RouteComponentProps<{ id: string }>;

export interface Rating {
  rating: number;
  description: string;
  name: string;
  UserId: number;
  $created: string;
  $updated: string;
}

export interface Organization {
  id: string;
  name: string;
}

export default function AppDetails({ app, user, push, intl }: AppDetailsProps): JSX.Element {
  const [organization, setOrganization] = useState<Organization>(undefined);
  const [ratings, setRatings] = useState<Rating[]>([]);

  useEffect(() => {
    const fetchOrganization = async (): Promise<void> => {
      const { data } = await axios.get<Organization>(`/api/organizations/${app.OrganizationId}`);
      setOrganization(data);
    };

    fetchOrganization();
  }, [app.OrganizationId]);

  useEffect(() => {
    const fetchOrganization = async (): Promise<void> => {
      const { data } = await axios.get<Rating[]>(`/api/apps/${app.id}/ratings`);
      setRatings(data);
    };

    fetchOrganization();
  }, [app.OrganizationId, app.id]);

  const onRate = (rating: Rating): void => {
    setRatings(ratings.map(r => (r.UserId === rating.UserId ? rating : r)));
    push({ color: 'success', body: intl.formatMessage(messages.ratingSuccessful) });
  };

  if (!organization) {
    return <Loader />;
  }

  return (
    <>
      <div className="content">
        <div className={styles.titleContainer}>
          <figure className="image is-64x64 is-marginless	">
            <img alt="App logo" src={`/api/apps/${app.id}/icon`} />
          </figure>
          <div className="is-block">
            <h1 className="is-marginless">{app.definition.name}</h1>
            <h3 className="is-marginless">{organization.name}</h3>
          </div>
        </div>
        <blockquote className={styles.description}>{app.definition.description}</blockquote>
        <h3>
          <FormattedMessage {...messages.ratings} />
        </h3>
      </div>
      {user && <RateApp className={styles.ratingButton} onRate={onRate} />}
      <div className="content">
        {ratings.map(rating => (
          <div key={rating.$created}>
            <span className="is-block has-text-weight-bold">
              {rating.name || <FormattedMessage {...messages.anonymous} />}
              <span className={`tag is-success ${styles.tag}`}>
                <FormattedMessage {...messages.you} />
              </span>
            </span>
            <Rating className="is-inline" value={rating.rating} />{' '}
            <span className="is-inline has-text-grey-light is-size-7">
              {new Date(rating.$updated).toLocaleString()}
            </span>
            {rating.description && (
              <blockquote className={styles.description}>{rating.description}</blockquote>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
