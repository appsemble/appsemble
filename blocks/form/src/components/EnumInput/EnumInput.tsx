import React from 'react';

import { InputProps } from '../../../block';
import styles from './EnumInput.css';

type EnumInputProps = InputProps<string, HTMLSelectElement>;

/**
 * Render a select box which offers choices a JSON schema enum.
 */
export default class EnumInput extends React.Component<EnumInputProps> {
  static defaultProps: Partial<EnumInputProps> = {
    value: '',
  };

  render(): JSX.Element {
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
                  onChange={event => onChange(event, event.target.value)}
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
  }
}
