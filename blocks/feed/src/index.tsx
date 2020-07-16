import { bootstrap, FormattedMessage } from '@appsemble/preact';
import { Loader } from '@appsemble/preact-components';
import { h } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import Card from './components/Card';
import styles from './index.css';

const messages = {
  anonymous: 'Anonymous',
  empty: 'No data to display',
  reply: 'Leave a message…',
  replyError: 'Something went wrong trying to send this message.',
};

interface Item {
  id: number;
  status: string;
  fotos: string[];
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
        <FormattedMessage id="empty" />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {data.map((content) => (
        <Card key={content.id} content={content} onUpdate={onUpdate} />
      ))}
    </div>
  );
}, messages);
