/** @jsx h */
import { attach } from '@appsemble/sdk';
import { compileFilters, MapperFunction } from '@appsemble/utils';
import { h } from 'mini-jsx';

import styles from './index.css';

attach(({ block, events }) => {
  const { fields } = block.parameters;

  const wrapper = (
    <div className={styles.wrapper}>
      <div className={styles.loader} />
    </div>
  );

  const remappers: Record<string, MapperFunction> = {};
  fields.forEach(({ name }) => {
    remappers[name] = compileFilters(name);
  });

  events.on.data((data, error) => {
    if (error) {
      wrapper.firstChild.replaceWith('error');
    } else {
      wrapper.firstChild.replaceWith(
        ...fields.map(({ icon, label, name }) => (
          <div className={styles.field}>
            <i className={`fas fa-${icon} ${styles.icon}`} />
            <div className={`has-text-weight-bold ${styles.value}`}>{remappers[name](data)}</div>
            <div>{label || name}</div>
          </div>
        )),
      );
    }
  });

  return <div>{wrapper}</div>;
});
