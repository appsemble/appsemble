import { bootstrap } from '@appsemble/sdk';

import styles from './index.module.css';

bootstrap(({ events, parameters: { fields }, utils: { fa, remap } }) => {
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
              <i className={`${fa(icon)} ${styles.icon}`} />
              <div className="has-text-weight-bold mx-0 mt-2 mb-1">
                {remap(value, data) as string}
              </div>
              {remappedLabel ? <div>{remappedLabel as string}</div> : null}
            </div>
          );
        }),
      );
    }
  });

  return <div>{wrapper}</div>;
});
