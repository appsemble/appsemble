import classNames from 'classnames';
import noUiSlider, { type target } from 'nouislider';
import 'nouislider/dist/nouislider.css';
import { type ComponentProps, type JSX, type VNode } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

import styles from './index.module.css';

export interface DualSliderProps
  extends Omit<ComponentProps<'input'>, 'label' | 'onChange' | 'onInput' | 'type'> {
  readonly from: number;
  readonly to: number;

  /**
   * Whether to render the input in an error state.
   */
  readonly error?: boolean;

  /**
   * This is fired when the input value has changed.
   *
   * If the input type is `number`, the value is a number, otherwise it is a string.
   */
  readonly onChange?: (event: JSX.TargetedEvent<HTMLInputElement>, value: [number, number]) => void;
}

/**
 * A Bulma styled form input element.
 */
export function DualSlider({
  error,
  name,
  id = name,
  from = 0,
  onChange,
  to = 100,
}: DualSliderProps): VNode {
  const sliderRef = useRef<HTMLDivElement & target>(null);
  const sliderInitiated = useRef(false);

  useEffect(() => {
    if (!sliderInitiated.current) {
      noUiSlider.cssClasses.target += ` ${styles.target}`;
      noUiSlider.cssClasses.connect += ` ${styles.connect}`;
      noUiSlider.cssClasses.handle += ` ${styles.handle}`;

      noUiSlider.create(sliderRef.current, {
        start: [from, to],
        connect: true,
        range: {
          min: from,
          max: to,
        },
      });

      sliderInitiated.current = true;

      sliderRef.current.noUiSlider.on('change', (values) => {
        const event = { currentTarget: { name: name as string } } as Event & {
          currentTarget: EventTarget & HTMLInputElement;
        };

        const [v1, v2] = values;

        const min = Math.round(Number(v1));
        const max = Math.round(Number(v2));

        onChange(event, [min, max] as [number, number]);
      });
    }
  }, [from, to, onChange, name]);

  return (
    <div
      className={classNames(styles.dual_slider, {
        'is-error': error,
      })}
      id={id}
      ref={sliderRef}
    />
  );
}
