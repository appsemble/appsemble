import { bootstrap } from '@appsemble/sdk';

import styles from './index.module.css';

bootstrap(({ events, parameters: { fields }, utils: { fa, remap } }) => {
  const wrapper = (
    <div className={styles.wrapper}>
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
          const remappedLabel = remap(label, data) as string;

          return (
            <div className={styles.field}>
              <i className={`${fa(icon)} ${styles.icon}`} />
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

  return <div>{wrapper}</div>;
});
