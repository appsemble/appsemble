// `src/index.tsx` is the initial entry poinf of the block source code run. For small blocks this
// often contains the entire logic of the block. Bigger blocks are often split into smaller modules.

// Normally bootstrap is imported from @appsemble/sdk. When using preact, it must be imported from
// @appsemble/preact instead.
import { bootstrap, FormattedMessage } from '@appsemble/preact';
import { useEffect, useState } from 'preact/hooks';

// The bootstrap function injects various properties that can be destructured. You can use your
// editor’s autocomplete to see which variables are available. These properties can also be accessed
// from anywhere in a preact component using the useBlock() hook.
bootstrap(({ events, parameters: { fields }, ready }) => {
  // The @appsemble/preact bootstrap function renders a component. This means preact hooks such as
  // useState and useEffect can be used.
  const [data, setData] = useState<any[]>();
  const [error, setError] = useState(false);

  // The block needs to call ready() once when it’s ready. Appsemble waits for all blocks to be
  // ready before it dispatches any actions or events.
  useEffect(() => {
    ready();
  }, [ready]);

  // The preferred way to listen for handling data is using event listeners. At first it may seem
  // simpler to use actions, but event handlers give users the ability to do additional processing
  // in another block, or to render the same data in different blocks. Typically user data is loaded
  // using the data-loader block.
  useEffect(() => {
    const onData = (newData: unknown[], newError: unknown): void => {
      if (newError) {
        setError(true);
        // @ts-expect-error this is valid.
        setData();
      } else {
        setData(newData);
        setError(false);
      }
    };

    events.on.data(onData);

    return () => {
      events.off.data(onData);
    };
  }, [events]);

  // It’s always important to handle errors. Events may emit errors for various reasons that are
  // out of control for this block.
  if (error) {
    return (
      <p>
        <FormattedMessage id="error" />
      </p>
    );
  }

  // It’s always important to handle the loading state.
  if (!data) {
    return (
      <p>
        <FormattedMessage id="loading" />
      </p>
    );
  }

  // It’s always important to handle an empty state
  if (!data.length) {
    return (
      <p>
        <FormattedMessage id="empty" />
      </p>
    );
  }

  return (
    // Bulma classes are supported in Appsemble blocks. See https://bulma.io/documentation
    <table className="table">
      <thead>
        <tr>
          {fields.map((field) => (
            <th key={field}>{field}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, dataIndex) => (
          // Because any data may be emitted, it’s often hard to determine the correct key to use.
          // Often an id property is known, at least this handles the use case of Appsemble
          // resources.
          <tr key={item.id || dataIndex}>
            {fields.map((field) => (
              <td key={field}>{item[field]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
});
