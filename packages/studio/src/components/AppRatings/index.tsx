import {
  Button,
  Content,
  Loader,
  Message,
  Title,
  useData,
  useMessages,
} from '@appsemble/react-components';
import type { Rating } from '@appsemble/types';
import React, { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import useUser from '../../hooks/useUser';
import { useApp } from '../AppContext';
import RateApp from '../RateApp';
import StarRating from '../Rating';
import styles from './index.css';
import messages from './messages';

export default function AppRatings(): ReactElement {
  const { app } = useApp();
  const { data: ratings, error, loading, refresh, setData: setRatings } = useData<Rating[]>(
    `/api/apps/${app.id}/ratings`,
  );
  const { formatMessage } = useIntl();

  const push = useMessages();
  const { userInfo } = useUser();

  const onRate = (rating: Rating): void => {
    const existingRating = ratings.find((r) => r.UserId === rating.UserId);

    if (existingRating) {
      setRatings(ratings.map((r) => (r.UserId === rating.UserId ? rating : r)));
    } else {
      setRatings([rating, ...ratings]);
    }
    push({ color: 'success', body: formatMessage(messages.ratingSuccessful) });
  };

  if (error) {
    return (
      <Content padding>
        <Message color="danger">
          <p>
            <FormattedMessage {...messages.loadError} />
          </p>
          <Button color="danger" onClick={refresh}>
            <FormattedMessage {...messages.retry} />
          </Button>
        </Message>
      </Content>
    );
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <Content className="ml-0 mt-2" padding>
      <Title>
        <FormattedMessage {...messages.ratings} />
      </Title>
      {userInfo && <RateApp app={app} className="mb-4" onRate={onRate} />}
      <div className="content">
        {ratings.map((rating) => (
          <div key={rating.$created} className="mb-4">
            <span className="is-block has-text-weight-bold">
              {rating.name || <FormattedMessage {...messages.anonymous} />}
              {userInfo && rating.UserId === userInfo.sub && (
                <span className="tag is-success ml-2">
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
    </Content>
  );
}
