import { bootstrap, type BlockProps } from '@appsemble/preact';
import { Loader } from '@appsemble/preact-components';
import { type VNode } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import { BulletPoints } from './components/BulletPoints/index.js';
import { Field } from './components/Field/index.js';
import { FieldGroup } from './components/FieldGroup/index.js';
import styles from './index.module.css';

export function DetailViewer({
  data: blockData,
  events,
  parameters,
  ready,
  utils,
}: BlockProps): VNode {
  const [data, setData] = useState(blockData);
  const [loading, setLoading] = useState(blockData == null);

  useEffect(() => {
    const hasListener = events.on.data((d) => {
      setData(d);
      setLoading(false);
    });
    if (!hasListener) {
      setLoading(false);
    }
    ready();
  }, [events, ready]);

  if (loading) {
    return <Loader label={utils.formatMessage('loading')} />;
  }

  return (
    <div className={`${styles.root} px-2 py-2 is-flex`}>
      {parameters.fields.map((field, index) => {
        if ('fields' in field) {
          return <FieldGroup data={data} field={field} key={field.value || field.label || index} />;
        }

        if ('bullets' in field) {
          return (
            <BulletPoints data={data} field={field} key={field.value || field.label || index} />
          );
        }

        return (
          <Field
            data={data}
            field={field}
            key={field.value || field.label || `${field.type}.${index}`}
          />
        );
      })}
    </div>
  );
}

bootstrap(DetailViewer);
