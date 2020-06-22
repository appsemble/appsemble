import { bootstrap } from '@appsemble/preact';
import { Loader } from '@appsemble/preact-components';
import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import FileRenderer from './components/FileRenderer';
import GeoCoordinatesRenderer from './components/GeoCoordinatesRenderer';
import StringRenderer from './components/StringRenderer';
import styles from './index.css';

const renderers = {
  file: FileRenderer,
  geocoordinates: GeoCoordinatesRenderer,
  string: StringRenderer,
};

bootstrap(({ data: blockData, events, parameters, ready, theme }) => {
  const [data, setData] = useState(blockData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hasListener = events.on.data((d) => {
      setData(d);
      setLoading(false);
    });
    setLoading(hasListener);
    ready();
  }, [events, ready]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className={styles.root}>
      {parameters.fields.map((field, index) => {
        // Always default to string if type is not supported in renderers list.
        const Comp = renderers[field.type] || renderers.string;

        return (
          <Comp
            key={field.name || field.label || `${field.type}.${index}`}
            data={data}
            data-index={index}
            data-type={field.type}
            // @ts-expect-error
            field={field}
            theme={theme}
          />
        );
      })}
    </div>
  );
});
