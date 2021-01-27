import { attach } from '@appsemble/sdk';
// XXX Update mini-jsx to use jsxImportSource
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'mini-jsx';

import styles from './index.css';

attach(({ events, parameters: { fields }, utils: { remap } }) => {
  const wrapper = (
    <div className={`${styles.wrapper} is-flex`}>
      <div className={styles.loader} />
    </div>
  );

  events.on.data((data, error) => {
    while (wrapper.lastElementChild) {
      wrapper.lastElementChild.remove();
    }

    if (error) {
      wrapper.append('error');
    } else {
      wrapper.append(
        ...fields.map(({ icon, label, value }) => {
          const remappedLabel = remap(label, data);

          return (
            <div className={`${styles.field} is-inline has-text-centered`}>
              <i className={`fas fa-${icon} ${styles.icon}`} />
              <div className="has-text-weight-bold mx-0 mt-2 mb-1">{remap(value, data)}</div>
              {remappedLabel && <div>{remappedLabel}</div>}
            </div>
          );
        }),
      );
    }
  });

  return <div>{wrapper}</div>;
});
