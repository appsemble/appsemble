// `src/index.tsx` is the initial entry point of the block source code run. For small blocks this
// often contains the entire logic of the block. Bigger blocks are often split into smaller modules.
import { bootstrap } from '@appsemble/sdk';

import styles from './index.module.css';

// The bootstrap function injects various properties that can be destructured. You can use your
// editor’s autocomplete to see which variables are available.
bootstrap(({ events, parameters: { fields }, utils: { fa, formatMessage, remap } }) => {
  /**
   * The wrapper element is used to assign data to when it has loaded asynchronously.
   */
  const wrapper = (
    // In this template the JSX is handled by mini-jsx (https://gitlab.com/appsemble/mini-jsx).
    // This is a small library that turns JSX into plain DOM nodes. Unlike React or Preact, no
    // virtual DOM or state management is involved.
    <div className={styles.wrapper}>
      <div className={styles.loader} />
    </div>
  );

  // The preferred way to listen for handling data is using event listeners. At first it may seem
  // simpler to use actions, but event handlers give users the ability to do additional processing
  // in another block, or to render the same data in different blocks. Typically user data is loaded
  // using the data-loader block.
  events.on.data((data, error) => {
    while (wrapper.lastChild) {
      wrapper.lastChild.remove();
    }

    if (error) {
      // It’s always important to handle errors. Events may emit errors for various reasons that are
      // out of control for this block.
      wrapper.append(formatMessage('error'));
    } else {
      wrapper.append(
        ...fields.map(({ icon, label, value }) => {
          // The remap utility is a powerful tool to transform user data. A full reference is found
          // on https://appsemble.app/docs/remappers. However, for the block all that
          // matters is we can pass in a user defined remapper and a value, and get the value the
          // user wants to use.
          const remappedLabel = remap(label, data) as string;

          return (
            <div className={styles.field}>
              <i className={`${fa(icon)} ${styles.icon}`} />
              {/* Bulma classes are supported. See https://bulma.io/documentation */}
              <div className={`has-text-weight-bold ${styles.value}`}>
                {remap(value, data) as string}
              </div>
              {remappedLabel ? <div>{remappedLabel}</div> : null}
            </div>
          );
        }),
      );
    }
  });

  // If a DOM node is returned by the bootstrap function, it will be rendered in the shadow root.
  return <div>{wrapper}</div>;
});
