import { BlockProps } from '@appsemble/react';
import React from 'react';

import { Actions, Field, Parameters } from '../../../block';
import styles from './ActionBlock.css';

export default class ActionBlock extends React.Component<BlockProps<Parameters, Actions>> {
  onUpdate = async (
    event: React.MouseEvent<HTMLButtonElement> | React.ChangeEvent<HTMLSelectElement>,
    field: Field,
  ) => {
    if ((!field.enum || !field.enum.length) && !field.value) {
      return;
    }

    const { actions, data } = this.props;

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
  };

  render(): JSX.Element {
    const { block, data } = this.props;
    const { fields, title } = block.parameters;

    return (
      <div className={`content ${styles.container}`}>
        <h1>{title}</h1>
        {fields.map((field, index) => {
          const { backgroundColor, color } = field;
          return (
            <div key={`${field.name}.${field.value}`} className={styles.actionField}>
              <button
                className="button"
                disabled={!!(field.enum && field.enum.length)}
                onClick={
                  field.enum && field.enum.length ? undefined : event => this.onUpdate(event, field)
                }
                style={{ ...(backgroundColor && { backgroundColor }), ...(color && { color }) }}
                type="button"
              >
                <span className="icon is-small">
                  <i className={`fas fa-${field.icon || 'bolt'}`} />
                </span>
                {(field.enum && field.enum.length) || (
                  <span className={styles.actionLabel}>{field.label || ''}</span>
                )}
              </button>
              {field.enum && field.enum.length && (
                <>
                  <label className={styles.actionLabel} htmlFor={`${field.name}.${index}`}>
                    {field.label || ''}
                  </label>
                  <div className={`select ${styles.enum}`}>
                    <select
                      defaultValue={data[field.name]}
                      id={`${field.name}.${index}`}
                      onChange={event => this.onUpdate(event, field)}
                    >
                      {field.enum.map(entry => (
                        <option key={entry.value} value={entry.value}>
                          {entry.label || entry.value}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  }
}
