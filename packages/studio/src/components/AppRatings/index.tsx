import { useData, useMessages } from '@appsemble/react-components';
import { Rating } from '@appsemble/types';
import React, { ReactElement, useCallback } from 'react';
import { FormattedDate, FormattedMessage, FormattedNumber, useIntl } from 'react-intl';

import { useApp } from '../AppContext';
import { AsyncDataView } from '../AsyncDataView';
import { HeaderControl } from '../HeaderControl';
import { RateApp } from '../RateApp';
import { StarRating } from '../StarRating';
import { useUser } from '../UserProvider';
import styles from './index.css';
import { messages } from './messages';

export function AppRatings(): ReactElement {
  const { app, setApp } = useApp();
  const result = useData<Rating[]>(`/api/apps/${app.id}/ratings`);
  const { formatMessage } = useIntl();

  const push = useMessages();
  const { userInfo } = useUser();

  const onRate = useCallback(
    (rating: Rating): void => {
      result.setData((ratings) => {
        const existingRating = ratings.find((r) => r.UserId === rating.UserId);

        return existingRating
          ? ratings.map((r) => (r.UserId === rating.UserId ? rating : r))
          : [rating, ...ratings];
      });
      setApp((a) => (a.rating.count ? a : { ...a, rating: { count: 1, average: rating.rating } }));
      push({ color: 'success', body: formatMessage(messages.ratingSuccessful) });
    },
    [formatMessage, push, result, setApp],
  );

  return (
    <div className="card">
      <div className="card-content">
        <HeaderControl
          className="is-marginless"
          control={userInfo && <RateApp app={app} className="mb-4" onRate={onRate} />}
          level={3}
        >
          <FormattedMessage {...messages.ratings} />
        </HeaderControl>
        {app.rating.count ? (
          <div>
            <FormattedMessage
              {...messages.average}
              values={{
                average: (
                  <span className="is-size-3 has-text-weight-semibold mr-1">
                    <FormattedNumber maximumFractionDigits={1} value={app.rating.average} />
                  </span>
                ),
              }}
            />
            <StarRating value={app.rating.average} />
          </div>
        ) : null}
      </div>
      <hr className="is-marginless" />
      <div className="card-content">
        <AsyncDataView
          emptyMessage={
            <p className="my-3">
              <FormattedMessage {...messages.noRatings} />
            </p>
          }
          errorMessage={<FormattedMessage {...messages.loadError} />}
          loadingMessage={<FormattedMessage {...messages.loadingRatings} />}
          result={result}
        >
          {(ratings) => (
            <div>
              {ratings.map((rating, index) => (
                <div className="mb-4" key={rating.$created}>
                  {index ? <hr /> : null}
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
          )}
        </AsyncDataView>
      </div>
    </div>
  );
}
