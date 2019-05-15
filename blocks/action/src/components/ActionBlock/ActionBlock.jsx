import React from 'react';
import PropTypes from 'prop-types';

import styles from './ActionBlock.css';

export default class ActionBlock extends React.Component {
  static propTypes = {
    /**
     * The actions as passed by the Appsemble interface.
     */
    actions: PropTypes.shape().isRequired,
    /**
     * The block as passed by the Appsemble interface.
     */
    block: PropTypes.shape().isRequired,
    data: PropTypes.shape().isRequired,
  };

  onUpdate = async (event, field) => {
    if (!field.enum?.length && !field.value) {
      return;
    }

    const { actions, data } = this.props;

    try {
      const updatedResource = {
        ...data,
        [field.name]: field.enum?.length ? event.target.value : field.value,
      };
      await actions.submit.dispatch(updatedResource);
      await actions.success.dispatch(updatedResource);
    } catch (ex) {
      await actions.error.dispatch(ex);
    }
  };

  render() {
    const { block, data } = this.props;
    const { fields, title } = block.parameters;

    return (
      <div className={`content ${styles.container}`}>
        <h1>{title}</h1>
        {fields.map(field => {
          const { backgroundColor, color } = field;
          return (
            <div key={`${field.name}.${field.value}`} className={styles.actionField}>
              <button
                className="button"
                disabled={field.enum?.length}
                onClick={field.enum?.length ? undefined : event => this.onUpdate(event, field)}
                style={{ ...(backgroundColor && { backgroundColor }), ...(color && { color }) }}
                type="button"
              >
                <span className="icon is-small">
                  <i className={`fas fa-${field.icon || 'bolt'}`} />
                </span>
              </button>
              <span className={styles.actionLabel}>{field.label || ''}</span>
              {field.enum?.length && (
                <div className={`select ${styles.enum}`}>
                  <select
                    defaultValue={data[field.name]}
                    onChange={event => this.onUpdate(event, field)}
                  >
                    {field.enum.map(entry => (
                      <option key={entry.value} value={entry.value}>
                        {entry.label || entry.value}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
}
