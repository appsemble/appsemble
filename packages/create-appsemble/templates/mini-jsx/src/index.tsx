import { attach } from '@appsemble/sdk';
import { h } from 'mini-jsx';

import styles from './index.css';

attach(({ events, parameters: { fields }, utils: { remap } }) => {
  const wrapper = (
    <div className={styles.wrapper}>
      <div className={styles.loader} />
    </div>
  );

  events.on.data((data, error) => {
    while (wrapper.lastElementChild) {
      wrapper.removeChild(wrapper.lastElementChild);
    }

    if (error) {
      wrapper.append('error');
    } else {
      wrapper.append(
        ...fields.map(({ icon, label, value }) => {
          const remappedLabel = remap(label, data);

          return (
            <div className={styles.field}>
              <i className={`fas fa-${icon} ${styles.icon}`} />
              <div className={`has-text-weight-bold ${styles.value}`}>{remap(value, data)}</div>
              {remappedLabel && <div>{remappedLabel}</div>}
            </div>
          );
        }),
      );
    }
  });

  return <div>{wrapper}</div>;
});
