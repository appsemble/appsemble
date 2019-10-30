import classNames from 'classnames';
import * as React from 'react';

import FormComponent, { FormComponentProps } from '../FormComponent';
import Icon from '../Icon';
import styles from './Input.css';

type InteractiveElement = HTMLInputElement | HTMLTextAreaElement;

type InputProps = FormComponentProps &
  Omit<React.ComponentProps<'input' | 'textarea'>, 'label' | 'onChange' | 'ref'> & {
    /**
     * An error message to render.
     */
    error?: React.ReactNode;

    /**
     * A help message to render.
     */
    help?: React.ReactNode;

    inputRef?: React.Ref<InteractiveElement>;

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
  onChange = (event: React.ChangeEvent<InteractiveElement>): void => {
    const { onChange, type } = this.props;

    const target = event.target as HTMLInputElement;
    onChange(event, type === 'number' ? target.valueAsNumber : target.value);
  };

  render(): JSX.Element {
    const {
      error,
      iconLeft,
      help,
      inputRef,
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
          {...(props as (React.HTMLProps<HTMLInputElement & HTMLTextAreaElement>))}
          ref={inputRef as React.Ref<any>}
          className={classNames('input', { 'is-danger': error })}
          id={id}
          name={name}
          onChange={this.onChange}
          required={required}
          type={type}
        />
        {iconLeft && <Icon className="is-left" icon={iconLeft} />}
        <p className={classNames('help', styles.help, { 'is-danger': error })}>
          {React.isValidElement(error) ? error : help}
        </p>
      </FormComponent>
    );
  }
}
