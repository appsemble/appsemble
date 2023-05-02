import { bootstrap } from '@appsemble/preact';
import { Loader } from '@appsemble/preact-components';
import { type VNode } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';

import { ItemRow } from './components/ItemRow/index.js';

interface Item {
  id?: number;
}

bootstrap(({ events, parameters: { fields }, ready, utils }) => {
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const headers = useMemo<VNode>(() => {
    const heads = fields.flatMap((field) => {
      if ('label' in field) {
        return utils.remap(field.label, {});
      }

      if ('repeat' in field) {
        return field.repeat.map((subField) => utils.remap(subField.label, {}));
      }
    });

    // Don’t render any headers if none of the headers have labels
    if (!heads.some(Boolean)) {
      return;
    }

    return (
      <thead>
        <tr>
          {heads.map((header) => (
            <th key={header}>{header as string}</th>
          ))}
        </tr>
      </thead>
    );
  }, [fields, utils]);

  useEffect(() => {
    events.on.data((d: Item | Item[], err) => {
      if (err) {
        setError(true);
      } else {
        const items = Array.isArray(d) ? d : [d];
        setData(items.filter((item) => item != null));
        setError(false);
      }
      setLoading(false);
    });
    ready();
  }, [events, ready, utils]);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <p className="px-2 py-2 has-text-centered">{utils.formatMessage('error')}</p>;
  }

  if (!data.length) {
    return <p className="px-2 py-2 has-text-centered">{utils.formatMessage('emptyMessage')}</p>;
  }

  return (
    <table className="table is-hoverable is-striped is-fullwidth" role="grid">
      {headers}
      <tbody>
        {data.map((item, index) => (
          <ItemRow index={index} item={item} key={item.id || index} />
        ))}
      </tbody>
    </table>
  );
});
