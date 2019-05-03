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

  onUpdate = async (field, event) => {
    if (!field.enum?.length && !field.value) {
      return;
    }

    const { actions, data = { foo: 123, bar: 'baz' } } = this.props;

    try {
      await actions.submit.dispatch({
        ...data,
        [field.name]: field.enum?.length ? event.target.value : field.value,
      });

      await actions.success.dispatch();
    } catch (exception) {
      await actions.error.dispatch(exception);
    }
  };

  render() {
    const { block } = this.props;
    const { fields, title } = block.parameters;

    return (
      <div className={`content ${styles.container}`}>
        <h1>{title}</h1>
        {fields.map(field => {
          return (
            <div key={`${field.name}.${field.value}`} className={styles.actionField}>
              <button
                className="button"
                disabled={field.enum?.length}
                onClick={event => this.onUpdate(field, event)}
                type="button"
              >
                <span className="icon is-small">
                  <i className="fas fa-hand-point-right" />
                </span>
              </button>
              <span className={styles.actionLabel}>{field.label || ''}</span>
              {field.enum?.length && (
                <div className={`select ${styles.enum}`}>
                  <select onChange={event => this.onUpdate(field, event)}>
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
