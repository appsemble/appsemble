import PropTypes from 'prop-types';
import React from 'react';

import styles from './EnumInput.css';

/**
 * Render a select box which offers choices a JSON schema enum.
 */
export default class EnumInput extends React.Component {
  static propTypes = {
    /**
     * The enum field to render.
     */
    field: PropTypes.shape().isRequired,
    /**
     * A callback for when the value changes.
     */
    onChange: PropTypes.func.isRequired,
    /**
     * The current value.
     */
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  };

  static defaultProps = {
    value: '',
  };

  render() {
    const { field, onChange, value } = this.props;
    return (
      <div className="field is-horizontal">
        <div className="field-label is-normal">
          <label className="label" htmlFor={field.name}>
            {field.label || field.name}
          </label>
        </div>
        <div className="field-body">
          <div className="field">
            <div className="control">
              <div className="select">
                <select
                  className={value ? null : 'empty'}
                  id={field.name}
                  name={field.name}
                  onChange={onChange}
                  value={value}
                >
                  {!value && <option className={styles.hidden}>{field.label}</option>}
                  {field.enum.map(choice => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label || choice.value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    // return (
    //   <SelectField
    //     id={field.name}
    //     label={field.label || field.name}
    //     name={field.name}
    //     onChange={onChange}
    //     SelectProps={{
    //       className: value ? null : 'empty',
    //     }}
    //     value={value}
    //   >
    // {!value && <option className={styles.hidden}>{field.label}</option>}
    // {field.enum.map(choice => (
    //   <option key={choice.value} value={choice.value}>
    //     {choice.label || choice.value}
    //   </option>
    // ))}
    //   </SelectField>
    // );
  }
}
