/** @jsx h */
import { attach } from '@appsemble/sdk';
import { h } from 'mini-jsx';

import { Actions, Field, Parameters } from '../block';
import styles from './index.css';

attach<Parameters, Actions>(({ actions, block, data }) => {
  const { fields, title } = block.parameters;

  async function onUpdate(event: Event, field: Field): Promise<void> {
    if ((!field.enum || !field.enum.length) && !field.value) {
      return;
    }

    try {
      const updatedResource = {
        ...data,
        [field.name]:
          field.enum && field.enum.length ? (event.target as HTMLSelectElement).value : field.value,
      };
      await actions.onSubmit.dispatch(updatedResource);
      await actions.onSuccess.dispatch(updatedResource);
    } catch (ex) {
      await actions.onError.dispatch(ex);
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{title}</h1>
      {fields.map((field, index) => {
        const { backgroundColor, color } = field;
        return field.enum && field.enum.length ? (
          <div className={`${styles.actionField} ${styles.enumField}`}>
            <label htmlFor={`${field.name}.${index}`}>{field.label || ''}</label>
            <div className="select">
              <select
                className={styles.enum}
                id={`${field.name}.${index}`}
                onchange={event => onUpdate(event, field)}
                value={data[field.name]}
              >
                {field.enum.map(entry => (
                  <option value={`${entry.value}`}>{entry.label || entry.value}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <button
            className={`button ${styles.button} ${styles.actionField}`}
            disabled={!!(field.enum && field.enum.length)}
            onclick={field.enum && field.enum.length ? undefined : event => onUpdate(event, field)}
            style={{ backgroundColor, color, borderColor: color }}
            type="button"
          >
            {!field.enum && <span className={styles.actionLabel}>{field.label || ''}</span>}
          </button>
        );
      })}
    </div>
  );
});
