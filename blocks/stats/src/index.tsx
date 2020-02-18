/** @jsx h */
import { attach } from '@appsemble/sdk';
import { compileFilters, MapperFunction } from '@appsemble/utils';
import { h } from 'mini-jsx';

import { Events, Parameters } from '../block';
import styles from './index.css';

attach<Parameters, unknown, Events>(({ block, events }) => {
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
            <span className={`has-text-weight-bold ${styles.value}`}>{remappers[name](data)}</span>
            <span>{label || name}</span>
          </div>
        )),
      );
    }
  });

  return <div>{wrapper}</div>;
});
