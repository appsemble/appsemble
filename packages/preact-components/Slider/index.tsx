import classNames from 'classnames';
import { type ComponentProps, type JSX } from 'preact';
import { forwardRef } from 'preact/compat';
import { useCallback } from 'preact/hooks';

export interface SliderProps
  extends Omit<ComponentProps<'input'>, 'label' | 'onChange' | 'onInput' | 'type'> {
  /**
   * Whether to render the input in an error state.
   */
  error?: boolean;

  /**
   * This is fired when the input value has changed.
   *
   * If the input type is `number`, the value is a number, otherwise it is a string.
   */
  onChange?: (event: JSX.TargetedEvent<HTMLInputElement>, value: number) => void;
}

/**
 * A Bulma styled form input element.
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ error, name, onChange, readOnly, id = name, ...props }, ref) => {
    const handleChange = useCallback(
      (event: JSX.TargetedEvent<HTMLInputElement>) => {
        const { currentTarget } = event;
        onChange(event, currentTarget.valueAsNumber);
      },
      [onChange],
    );

    return (
      <input
        {...props}
        className={classNames('slider is-fullwidth', {
          'is-danger': error,
        })}
        id={id}
        name={name}
        onChange={handleChange}
        readOnly={readOnly}
        ref={ref}
        type="range"
      />
    );
  },
);
