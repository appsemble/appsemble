import { bootstrap, FormattedMessage } from '@appsemble/preact';
import { Loader } from '@appsemble/preact-components';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { Card } from './components/Card/index.js';
import styles from './index.module.css';

interface Item {
  id: number;
  status: string;
  photos: string[];
}

bootstrap(({ events, ready }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Item[]>([]);

  const onUpdate = useCallback(
    (resource: Item): void => {
      setData(data.map((entry) => (entry.id === resource.id ? resource : entry)));
    },
    [data],
  );

  const loadData = useCallback((d: Item[]) => {
    setLoading(false);
    setData(d);
  }, []);

  useEffect(() => {
    events.on.data(loadData);
    ready();
  }, [events, loadData, ready]);

  if (loading) {
    return <Loader />;
  }

  if (!data.length) {
    return (
      <div className={styles.empty}>
        <FormattedMessage id="emptyLabel" />
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
