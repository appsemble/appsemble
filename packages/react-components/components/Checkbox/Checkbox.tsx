import classNames from 'classnames';
import * as React from 'react';

import FormComponent, { FormComponentProps } from '../FormComponent';

type CheckboxProps = FormComponentProps &
  React.HTMLProps<HTMLInputElement> & {
    /**
     * The name of the HTML element.
     */
    name: string;

    /**
     * A help message to render next to the checkbox.
     */
    help?: React.ReactNode;

    /**
     * This is fired when the input value has changed.
     */
    onChange: (event: React.ChangeEvent<HTMLInputElement>, value: boolean) => void;
  };

/**
 * A Bulma styled form select element.
 */
export default class Checkbox extends React.Component<CheckboxProps> {
  onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { onChange } = this.props;

    onChange(event, event.target.checked);
  };

  render(): JSX.Element {
    const { label, name, help, id = name, className, ...props } = this.props;

    return (
      <FormComponent id={id} label={label} required>
        <input
          {...props}
          className={classNames('is-checkradio', className)}
          id={id}
          name={name}
          onChange={this.onChange}
          type="checkbox"
        />
        <label htmlFor={id}>{help}</label>
      </FormComponent>
    );
  }
}
