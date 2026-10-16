import classNames from 'classnames';
import { type ComponentProps, type JSX } from 'preact';
import { forwardRef } from 'preact/compat';
import { type MutableRef, useCallback, useContext, useLayoutEffect, useRef } from 'preact/hooks';

import styles from './index.module.css';
import { FormComponentContext } from '../FormComponent/index.js';
import { useCombinedRefs } from '../useCombinedRefs.js';

export interface SliderProps extends Omit<
  ComponentProps<'input'>,
  'label' | 'onChange' | 'onInput' | 'type'
> {
  /**
   * Whether to render the input in an error state.
   */
  error?: boolean;

  /**
   * Whether there is an icon next to the slider.
   */
  readonly hasIcon?: boolean;

  /**
   * This is fired when the input value has changed.
   *
   * If the input type is `number`, the value is a number, otherwise it is a string.
   */
  onChange?: (event: JSX.TargetedEvent<HTMLInputElement>, value: number) => void;

  /**
   * The ref to the element used for scrolling to the field error
   */
  readonly errorLinkRef?: MutableRef<HTMLElement>;
}

function updateProgress(input: HTMLInputElement): void {
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const progress = max > min ? ((input.valueAsNumber - min) / (max - min)) * 100 : 0;
  input.style.setProperty('--slider-progress', `${progress}%`);
}

/**
 * A Bulma styled form input element.
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ errorLinkRef, error, hasIcon, name, onChange, readOnly, id = name, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useLayoutEffect(() => {
      updateProgress(inputRef.current!);
    });

    const handleChange = useCallback(
      (event: JSX.TargetedEvent<HTMLInputElement>) => {
        const { currentTarget } = event;
        onChange?.(event, currentTarget.valueAsNumber);
      },
      [onChange],
    );

    const combinedRef = useCombinedRefs(
      inputRef,
      ref as MutableRef<HTMLElement>,
      errorLinkRef as MutableRef<HTMLElement>,
    );

    const aria = useContext(FormComponentContext);

    return (
      <input
        {...aria}
        {...props}
        className={classNames('slider is-fullwidth', {
          'is-danger': error,
          [styles.sliderWithIcon]: hasIcon,
        })}
        id={id}
        name={name}
        onChange={handleChange}
        onInput={(event) => updateProgress(event.currentTarget)}
        readOnly={readOnly}
        ref={combinedRef}
        type="range"
      />
    );
  },
);
