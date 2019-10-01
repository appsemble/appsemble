/** @jsx h */
import { ClassAttributes, Component, h, JSX, PreactDOMAttributes, VNode } from 'preact';

import FormComponent, { FormComponentProps } from '../FormComponent';
import Icon from '../Icon';

type SelectProps = FormComponentProps &
  Omit<JSX.HTMLAttributes & PreactDOMAttributes & ClassAttributes<any>, 'label' | 'onInput'> & {
    /**
     * The name of the HTML element.
     */
    name: string;

    /**
     * This is fired when the input value has changed.
     */
    onInput: (event: Event, value: any) => void;
  };

/**
 * A Bulma styled form select element.
 */
export default class Select extends Component<SelectProps> {
  onInput = (event: Event): void => {
    const { onInput } = this.props;

    onInput(event, (event.target as HTMLSelectElement).value);
  };

  render(): VNode {
    const { iconLeft, label, name, required, id = name, ...props } = this.props;

    return (
      <FormComponent iconLeft={iconLeft} id={id} label={label} required={required}>
        <div className="select is-fullwidth">
          <select
            {...props}
            className="is-fullwidth"
            id={id}
            name={name}
            onInput={this.onInput}
            required={required}
          />
        </div>
        {iconLeft && <Icon className="is-left" icon={iconLeft} />}
      </FormComponent>
    );
  }
}
