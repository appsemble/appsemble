import classNames from 'classnames';
import { ComponentProps, h } from 'preact';
import { forwardRef } from 'preact/compat';
import { useCallback } from 'preact/hooks';

export interface TextAreaProps
  extends Omit<ComponentProps<'textarea'>, 'label' | 'onChange' | 'onInput'> {
  /**
   * Whether to render the input in an error state.
   */
  error?: boolean;

  /**
   * This is fired when the input value has changed.
   */
  onChange?: (event: h.JSX.TargetedEvent<HTMLTextAreaElement>, value: string) => void;
}

/**
 * A Bulma styled textarea element.
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ error, name, onChange, id = name, ...props }, ref) => {
    const handleChange = useCallback(
      (event: h.JSX.TargetedEvent<HTMLTextAreaElement>) => {
        onChange(event, event.currentTarget.value);
      },
      [onChange],
    );

    return (
      <textarea
        {...props}
        className={classNames('textarea', { 'is-danger': error })}
        id={id}
        name={name}
        onChange={handleChange}
        ref={ref}
      />
    );
  },
);
