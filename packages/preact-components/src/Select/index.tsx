import { ClassAttributes, h, JSX, PreactDOMAttributes, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

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
export default function Select({
  iconLeft,
  label,
  name,
  onInput,
  required,
  id = name,
  ...props
}: SelectProps): VNode {
  const handleInput = useCallback(
    (event: Event): void => {
      onInput(event, (event.currentTarget as HTMLSelectElement).value);
    },
    [onInput],
  );

  return (
    <FormComponent iconLeft={iconLeft} id={id} label={label} required={required}>
      <div className="select is-fullwidth">
        <select
          {...props}
          className="is-fullwidth"
          id={id}
          name={name}
          onInput={handleInput}
          required={required}
        />
      </div>
      {iconLeft && <Icon className="is-left" icon={iconLeft} />}
    </FormComponent>
  );
}
