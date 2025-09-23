import { bootstrap, FormattedMessage } from '@appsemble/preact';
import { Loader, Message } from '@appsemble/preact-components';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { CardContent } from './components/Card/index.js';

bootstrap(({ data: blockData, events, parameters: { hideOnNoData }, ready, utils }) => {
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
    return () => events.off.data(callback);
  }, [events]);

  useEffect(() => {
    if (blockData && Array.isArray(blockData)) {
      setData(blockData);
      if (!events.on.data) {
        setLoading(false);
      }
    }
  }, [blockData, events.on.data]);

  if (loading) {
    return <Loader />;
  }

  if (hideOnNoData && !data?.length) {
    return null;
  }

  if (error) {
    return (
      <Message className="mt-4 mr-6 mb-4 ml-5" color="danger">
        <span>
          <FormattedMessage id="error" />
        </span>
      </Message>
    );
  }

  if (!data?.length) {
    return (
      <Message className="mt-4 mr-6 mb-4 ml-5">
        <span>
          <FormattedMessage id="noData" />
        </span>
      </Message>
    );
  }

  return (
    <div className="container mt-4">
      <div className="columns is-multiline">
        {data.map((item, index) => (
          <div className="column is-one-quarter">
            <CardContent index={index} item={item} />
          </div>
        ))}
      </div>
    </div>
  );
});
