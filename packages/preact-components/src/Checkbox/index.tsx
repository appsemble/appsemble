import classNames from 'classnames';
import { ComponentChild, h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import { FormComponent } from '..';

type CheckboxProps = Omit<typeof FormComponent, 'children'> &
  Omit<h.JSX.HTMLAttributes<HTMLInputElement>, 'value' | 'label' | 'onChange'> & {
    error?: any;

    /**
     * The name of the HTML element.
     */
    name: string;

    /**
     * A help message to render next to the checkbox.
     */
    help?: ComponentChild;

    /**
     * The label to display above the checkbox.
     */
    label?: ComponentChild;

    /**
     * This is fired when the input value has changed.
     */
    onChange: (event: h.JSX.TargetedEvent<HTMLInputElement>, value: boolean) => void;

    /**
     * Whether or not the checkbox is checked.
     */
    value?: boolean;

    /**
     * Whether the component should render as a switch or as a square checkbox.
     */
    switch?: boolean;

    /**
     * Whether the label should be displayed to the right of the checkbox or to the left.
     *
     * @default false
     */
    rtl?: boolean;

    /**
     * The class used for the FormComponent wrapper.
     */
    wrapperClassName?: string;
  };

/**
 * A Bulma styled form select element.
 */
export function Checkbox({
  className,
  wrapperClassName,
  error,
  help = null,
  label,
  name,
  onChange,
  value,
  id = name,
  switch: isSwitch,
  rtl,
  ...props
}: CheckboxProps): VNode {
  const handleChange = useCallback(
    (event: h.JSX.TargetedEvent<HTMLInputElement>) => {
      onChange(event, event.currentTarget.checked);
    },
    [onChange],
  );

  return (
    <FormComponent className={wrapperClassName} id={id} label={label} required>
      <input
        {...props}
        checked={value}
        className={classNames(isSwitch ? 'switch' : 'is-checkradio', { 'is-rtl': rtl }, className)}
        id={id}
        name={name}
        onChange={handleChange}
        type="checkbox"
      />
      <label className={classNames({ 'is-danger': error })} htmlFor={id}>
        {help}
      </label>
      {error && <p className="help is-danger">{error}</p>}
    </FormComponent>
  );
}
