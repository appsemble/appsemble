import { bootstrap } from '@appsemble/preact';
import { Loader } from '@appsemble/preact-components';
import { useEffect, useState } from 'preact/hooks';

import { BulletPoints } from './components/BulletPoints/index.js';
import { Field } from './components/Field/index.js';
import { FieldGroup } from './components/FieldGroup/index.js';
import styles from './index.module.css';

bootstrap(({ data: blockData, events, parameters, ready }) => {
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
});
