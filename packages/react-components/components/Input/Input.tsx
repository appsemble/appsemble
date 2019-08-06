import classNames from 'classnames';
import * as React from 'react';

import FormComponent, { FormComponentProps } from '../FormComponent';
import Icon from '../Icon';

type InteractiveElement = HTMLInputElement | HTMLTextAreaElement;

type InputProps = FormComponentProps &
  Omit<React.HTMLProps<InteractiveElement>, 'label' | 'onChange'> & {
    /**
     * An error message to render.
     */
    error?: React.ReactNode;

    /**
     * A help message to render.
     */
    help?: React.ReactNode;

    /**
     * The name of the HTML element.
     */
    name: string;

    /**
     * This is fired when the input value has changed.
     *
     * If the input type is `checkbox`, the value is a boolean. If the input type is `number`, the
     * value is a number, otherwise it is a string.
     */
    onChange: (event: React.ChangeEvent<InteractiveElement>, value: number | string) => void;

    /**
     * The HTML input type.
     *
     * This may be extended if necessary.
     */
    type?:
      | 'color'
      | 'email'
      | 'number'
      | 'password'
      | 'search'
      | 'tel'
      | 'text'
      | 'textarea'
      | 'url';
  };

/**
 * A Bulma styled form input element.
 */
export default class Input extends React.Component<InputProps> {
  onChange = (event: React.ChangeEvent<InteractiveElement>) => {
    const { onChange, type } = this.props;

    const target = event.target as HTMLInputElement;
    onChange(event, type === 'number' ? target.valueAsNumber : target.value);
  };

  render(): JSX.Element {
    const {
      error,
      iconLeft,
      help,
      label,
      name,
      onChange,
      required,
      type,
      id = name,
      ...props
    } = this.props;

    const Component = type === 'textarea' ? 'textarea' : 'input';

    return (
      <FormComponent iconLeft={iconLeft} id={id} label={label} required={required}>
        <Component
          {...(props as React.HTMLProps<HTMLInputElement & HTMLTextAreaElement>)}
          className={classNames('input', { 'is-danger': error })}
          id={id}
          name={name}
          onChange={this.onChange}
          required={required}
          type={type}
        />
        {iconLeft && <Icon className="is-left" icon={iconLeft} />}
        {help && <p className="help">{help}</p>}
        {React.isValidElement(error) && <p className="help is-danger">{error}</p>}
      </FormComponent>
    );
  }
}
