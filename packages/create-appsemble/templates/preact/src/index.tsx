/** @jsx h */
import { bootstrap } from '@appsemble/preact';
import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import { Actions, Parameters } from '../block';

bootstrap<Parameters, Actions>(
  ({
    actions,
    block: {
      parameters: { fields },
    },
  }) => {
    const [data, setData] = useState<any[]>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
      actions.onLoad.dispatch().then(setData, () => {
        setError(true);
      });
    }, [actions]);

    if (error) {
      return <p>Error loading data.</p>;
    }

    if (!data) {
      return <p>Loading…</p>;
    }

    if (!data.length) {
      return <p>No data to display.</p>;
    }

    return (
      <table className="table">
        <thead>
          <tr>
            {fields.map(field => (
              <th key={field}>{field}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, dataIndex) => (
            <tr key={item.id || dataIndex}>
              {fields.map(field => (
                <td key={field}>{item[field]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
);
