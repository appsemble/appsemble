import {
  Button,
  Content,
  Loader,
  Message,
  useData,
  useMessages,
} from '@appsemble/react-components';
import type { Rating } from '@appsemble/types';
import React, { ReactElement } from 'react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import { useApp } from '../AppContext';
import { HeaderControl } from '../HeaderControl';
import { RateApp } from '../RateApp';
import { StarRating } from '../StarRating';
import { useUser } from '../UserProvider';
import styles from './index.css';
import { messages } from './messages';

export function AppRatings(): ReactElement {
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
    <>
      <HeaderControl
        control={userInfo && <RateApp app={app} className="mb-4" onRate={onRate} />}
        level={3}
      >
        <FormattedMessage {...messages.ratings} />
      </HeaderControl>
      <div>
        {ratings.map((rating) => (
          <div className="mb-4" key={rating.$created}>
            <hr />
            <div className="is-block has-text-weight-bold">
              {rating.name || <FormattedMessage {...messages.anonymous} />}
              {userInfo && rating.UserId === userInfo.sub && (
                <span className="tag is-success ml-2">
                  <FormattedMessage {...messages.you} />
                </span>
              )}
            </div>
            <StarRating className="is-inline" value={rating.rating} />
            <span className="is-inline has-text-grey-light is-size-7 ml-2">
              <FormattedDate value={rating.$updated} />
            </span>
            <p className={styles.description}>{rating.description}</p>
          </div>
        ))}
      </div>
    </>
  );
}
