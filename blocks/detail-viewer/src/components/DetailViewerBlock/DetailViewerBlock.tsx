/** @jsx h */
import { BlockProps } from '@appsemble/preact';
import { Loader } from '@appsemble/preact-components';
import { remapData } from '@appsemble/utils';
import { h, VNode } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import FileRenderer from '../FileRenderer';
import GeoCoordinatesRenderer from '../GeoCoordinatesRenderer';
import StringRenderer from '../StringRenderer';
import styles from './DetailViewerBlock.css';

const renderers = {
  file: FileRenderer,
  geocoordinates: GeoCoordinatesRenderer,
  string: StringRenderer,
};

/**
 * The main component for the Appsemble detail-viewer block.
 */
export default function DetailViewerBlock({ events, parameters, ready, theme }: BlockProps): VNode {
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
            parameters={parameters}
            theme={theme}
            value={field.name ? remapData(field.name, data) : null}
          />
        );
      })}
    </div>
  );
}
