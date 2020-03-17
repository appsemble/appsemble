/** @jsx h */
import { bootstrap } from '@appsemble/preact';
import { Loader } from '@appsemble/preact-components';
import { remapData } from '@appsemble/utils';
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

bootstrap(({ events, parameters, ready, theme }) => {
  const [data, setData] = useState(undefined);

  useEffect(() => {
    events.on.data(setData);
    ready();
  }, [events, ready]);

  if (data === undefined) {
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
            // @ts-ignore
            field={field}
            theme={theme}
            value={field.name ? remapData(field.name, data) : null}
          />
        );
      })}
    </div>
  );
});
