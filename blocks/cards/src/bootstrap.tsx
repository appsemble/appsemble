import { FormattedMessage, type BlockProps } from '@appsemble/preact';
import { Loader, Message } from '@appsemble/preact-components';
import { type VNode } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { CardContent } from './components/Card/index.js';

export function Cards({
  data: blockData,
  events,
  parameters: { hideOnNoData },
  ready,
  utils,
}: BlockProps): VNode | null {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const loadData = useCallback((d: any, err: string): void => {
    if (err) {
      setError(true);
    } else {
      setData(d);
      setError(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    ready();
    events.on.data(loadData);
    return () => events.off.data(loadData);
  }, [events, loadData, ready, utils]);

  useEffect(() => {
    const callback = (): void => setData([]);
    events.on.reset(callback);
    return () => events.off.reset(callback);
  }, [events]);

  useEffect(() => {
    if (blockData && Array.isArray(blockData)) {
      setData(blockData);
      if (!events.on.data) {
        setLoading(false);
      }
    }
  }, [blockData, events.on.data]);

  const hidden = hideOnNoData && !data?.length;
  const empty = !loading && !hidden && !error && !data?.length;

  return (
    <>
      {/* The region stays mounted, so screen readers announce the message added to it. */}
      {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
      <div role="status">
        {empty ? (
          <Message className="mt-4 mr-6 mb-4 ml-5">
            <span>
              <FormattedMessage id="noData" />
            </span>
          </Message>
        ) : null}
      </div>
      {loading ? (
        <Loader label={utils.formatMessage('loading')} />
      ) : hidden || empty ? null : error ? (
        <Message className="mt-4 mr-6 mb-4 ml-5" color="danger" role="alert">
          <span>
            <FormattedMessage id="error" />
          </span>
        </Message>
      ) : (
        <div className="container mt-4">
          <div className="columns is-multiline">
            {data.map((item, index) => (
              <div className="column is-one-quarter">
                <CardContent index={index} item={item} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
