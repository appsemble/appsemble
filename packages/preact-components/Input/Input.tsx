/** @jsx h */
import classNames from 'classnames';
import {
  ClassAttributes,
  Component,
  ComponentChild,
  h,
  JSX,
  PreactDOMAttributes,
  VNode,
} from 'preact';

import FormComponent, { FormComponentProps } from '../FormComponent';
import Icon from '../Icon';

type InputProps = FormComponentProps &
  Omit<JSX.HTMLAttributes & PreactDOMAttributes & ClassAttributes<any>, 'label' | 'onInput'> & {
    /**
     * An error message to render.
     */
    error?: ComponentChild;

    /**
     * A help message to render.
     */
    help?: ComponentChild;

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
    onInput: (event: Event, value: number | string) => void;

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
export default class Input extends Component<InputProps> {
  onInput = (event: Event) => {
    const { onInput, type } = this.props;

    const target = event.target as HTMLInputElement;
    onInput(event, type === 'number' ? target.valueAsNumber : target.value);
  };

  render(): VNode {
    const {
      error,
      iconLeft,
      help,
      label,
      name,
      onInput,
      required,
      type,
      placeholder,
      readOnly,
      id = name,
      ...props
    } = this.props;

    const Comp = type === 'textarea' ? 'textarea' : 'input';

    return (
      <FormComponent iconLeft={iconLeft} id={id} label={label} required={required}>
        <Comp
          {...props}
          className={classNames(type === 'textarea' ? 'textarea' : 'input', { 'is-danger': error })}
          id={id}
          name={name}
          onInput={this.onInput}
          placeholder={placeholder}
          readOnly={readOnly}
          required={required}
          type={type !== 'textarea' ? type : undefined}
        />
        {iconLeft && <Icon className="is-left" icon={iconLeft} />}
        {help && <p className="help">{help}</p>}
        {error && <p className="help is-danger">{error}</p>}
      </FormComponent>
    );
  }
}
