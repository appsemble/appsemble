import { bootstrap, FormattedMessage } from '@appsemble/preact';
import { Loader } from '@appsemble/preact-components';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { Card } from './components/Card/index.js';
import styles from './index.module.css';
import { getFeedErrorState, normalizeFeedData } from './utils/normalizeFeedData.js';

interface Item {
  id: number;
  status: string;
  photos: string[];
}

bootstrap(({ events, ready }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Item[]>([]);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const onUpdate = useCallback((resource: Item): void => {
    setData((currentData) =>
      currentData.map((entry) => (entry.id === resource.id ? resource : entry)),
    );
  }, []);

  const loadData = useCallback((receivedData: Item[] | null, error?: string) => {
    setLoading(false);
    setData(normalizeFeedData(receivedData, error));
    setPermissionDenied(getFeedErrorState(error).permissionDenied);
  }, []);

  useEffect(() => {
    events.on.data(loadData);
    ready();

    return () => events.off.data(loadData);
  }, [events, loadData, ready]);

  if (loading) {
    return <Loader />;
  }

  if (!data.length) {
    return (
      <div className={styles.empty}>
        <FormattedMessage id={permissionDenied ? 'permissionDeniedLabel' : 'emptyLabel'} />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {data.map((content) => (
        <Card content={content} key={content.id} onUpdate={onUpdate} />
      ))}
    </div>
  );
});
