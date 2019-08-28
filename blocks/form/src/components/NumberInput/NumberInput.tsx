/** @jsx h */
import classNames from 'classnames';
import { h, VNode } from 'preact';

import { InputProps } from '../../../block';
import messages from './messages';

type NumberInputProps = InputProps<number>;

/**
 * An input element for a number type schema.
 */
export default function NumberInput({ error, field, onChange, value }: NumberInputProps): VNode {
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
            <input
              className={classNames('input', { 'is-danger': error })}
              id={field.name}
              max={field.max}
              min={field.min}
              name={field.name}
              onChange={event => {
                onChange(
                  event,
                  field.type === 'integer'
                    ? Math.floor((event.target as HTMLInputElement).valueAsNumber)
                    : (event.target as HTMLInputElement).valueAsNumber,
                );
              }}
              placeholder={field.placeholder}
              readOnly={field.readOnly}
              required={field.required}
              step={field.step || field.type === 'integer' ? 1 : 'any'}
              type="number"
              value={value}
            />
            {error && (
              <p className={classNames('help', { 'is-danger': error })}>{messages.invalid}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
