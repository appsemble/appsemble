/** @jsx h */
import { BlockProps, FormattedMessage } from '@appsemble/preact';
import { Loader } from '@appsemble/preact-components';
import { compileFilters, MapperFunction } from '@appsemble/utils';
import { h, VNode } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { Remappers } from '../../../block';
import Card from '../Card';
import styles from './FeedBlock.css';

function createRemapper(mapper: any): MapperFunction {
  return mapper ? compileFilters(mapper) : () => null;
}

interface Item {
  id: number;
  status: string;
}

/**
 * The top level component for the feed block.
 */
export default function FeedBlock({ events, parameters, ready }: BlockProps): VNode {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Item[]>([]);
  const [remappers, setRemappers] = useState<Remappers>(undefined);

  const onUpdate = useCallback(
    (resource: Item): void => {
      setData(data.map(entry => (entry.id === resource.id ? resource : entry)));
    },
    [data],
  );

  const loadData = useCallback((d: Item[]) => {
    setLoading(false);
    setData(d);
  }, []);

  useEffect(() => {
    setRemappers({
      title: createRemapper(parameters.title),
      subtitle: createRemapper(parameters.subtitle),
      heading: createRemapper(parameters.heading),
      picture: createRemapper(parameters.picture),
      pictures: createRemapper(parameters.pictures),
      description: createRemapper(parameters.description),
      ...(parameters.reply && {
        author: createRemapper(parameters.reply.author),
        content: createRemapper(parameters.reply.content),
      }),
      latitude: createRemapper(parameters.latitude),
      longitude: createRemapper(parameters.longitude),
    });
  }, [parameters]);

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
      {data.map(content => (
        <Card key={content.id} content={content} onUpdate={onUpdate} remappers={remappers} />
      ))}
    </div>
  );
}
