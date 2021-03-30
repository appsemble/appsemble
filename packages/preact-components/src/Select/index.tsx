import { Option, OptionProps } from '@appsemble/preact-components';
import classNames from 'classnames';
import { ComponentProps, JSX, toChildArray, VNode } from 'preact';
import { forwardRef } from 'preact/compat';
import { useCallback } from 'preact/hooks';

export interface SelectProps
  extends Omit<ComponentProps<'select'>, 'loading' | 'onChange' | 'onInput'> {
  /**
   * Whether or not the element should take as much space as it can.
   */
  fullWidth?: boolean;

  /**
   * Indicate the select box is in a loading state.
   */
  loading?: boolean;

  /**
   * This is fired when the input value has changed.
   */
  onChange?: (event: JSX.TargetedEvent<HTMLSelectElement>, value?: any) => void;

  /**
   * The current value.
   */
  value: any;
}

/**
 * A Bulma styled form select element.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      children,
      className,
      fullWidth,
      loading,
      name,
      onChange,
      placeholder,
      value,
      id = name,
      ...props
    },
    ref,
  ) => {
    const childArray = toChildArray(children).filter(
      (child): child is VNode<OptionProps> =>
        typeof child !== 'string' && typeof child !== 'number' && child.type === Option,
    );

    const handleChange = useCallback(
      (event: JSX.TargetedEvent<HTMLSelectElement>) => {
        onChange(event, childArray[Number(event.currentTarget.value)].props.value);
      },
      [childArray, onChange],
    );

    let hasValue: boolean;
    const options = childArray.map((child, index) => {
      const selected = child.props.value === value;
      hasValue ||= selected;
      return <option key={child.key} {...child.props} selected={selected} value={index} />;
    });
    if (!hasValue) {
      options.unshift(
        <option className="is-hidden" selected>
          {placeholder}
        </option>,
      );
    }

    return (
      <div
        className={classNames('select', className, {
          'is-loading': loading,
          'is-fullwidth': fullWidth,
        })}
      >
        <select
          className={classNames({ 'has-text-grey-light': !hasValue, 'is-fullwidth': fullWidth })}
          id={id}
          name={name}
          onChange={handleChange}
          ref={ref}
          {...props}
        >
          {options}
        </select>
      </div>
    );
  },
);
