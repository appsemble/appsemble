// TODO: don't depend on this, declare your own type
import { type Remapper } from '@appsemble/lang-sdk';
import { useBlock } from '@appsemble/preact';
import classNames from 'classnames';
import { isSameDay, parseISO } from 'date-fns';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import 'flatpickr/dist/plugins/confirmDate/confirmDate.css';
import confirmDatePlugin from 'flatpickr/dist/plugins/confirmDate/confirmDate.js';
import { type ComponentProps, type JSX, type VNode } from 'preact';
import { type MutableRef, useCallback, useEffect, useRef, useState } from 'preact/hooks';

import { FormComponent, Input, type SharedFormComponentProps } from '../index.js';
import styles from './index.module.css';

type DateTimeFieldProps = Omit<ComponentProps<typeof Input>, 'error'> &
  Pick<
    flatpickr.Options.Options,
    | 'allowInput'
    | 'altFormat'
    | 'altInput'
    | 'disable'
    | 'enableTime'
    | 'locale'
    | 'maxDate'
    | 'maxTime'
    | 'minDate'
    | 'minTime'
    | 'minuteIncrement'
    | 'mode'
    | 'noCalendar'
  > &
  SharedFormComponentProps & {
    /**
     * Whether the confirm button should be shown.
     */
    readonly confirm?: boolean;

    /**
     * The text shown on the confirm button.
     *
     * @default 'Confirm'
     */
    readonly confirmLabel?: string;

    /**
     * If true, the value is emitted as an ISO8601 formatted string. Otherwise, a Date object is
     * used.
     */
    readonly iso?: boolean;

    /**
     * The change handler.
     *
     * @param event An object with the properties `target` and `currentTarget` set to the input
     *   element, to emulate an event.
     * @param value The value that was selected.
     */
    readonly onChange?: (event: JSX.TargetedEvent<HTMLInputElement>, value: Date | string) => void;

    /**
     * The current value as a Date object or an ISO8601 formatted string.
     */
    readonly value: Date | string;

    /**
     * The remapper used for custom value labels.
     */
    readonly dateFormat?: Remapper;

    /**
     * The ref to the element used for scrolling to the field error
     */
    readonly errorLinkRef?: MutableRef<HTMLElement>;

    readonly decorations?: {
      date: string;
      type?: 'border' | 'dot' | 'overlay';
      color?: string;
      label?: string;
      borderStyle?: 'dashed' | 'dotted' | 'double' | 'solid';
    }[];

    /**
     * Called when the month is changed.
     *
     * @param data An object with the new year and month.
     */
    readonly onMonthChange?: (data: { year: number; month: number }) => void;

    /**
     * Called when the year is changed.
     *
     * @param data An object with the new year and month.
     */
    readonly onYearChange?: (data: { year: number; month: number }) => void;
  };

export function DateTimeField({
  dateFormat,
  className,
  altInput,
  allowInput,
  altFormat,
  disable,
  disabled,
  confirm,
  confirmLabel = 'Confirm',
  enableTime,
  noCalendar,
  error,
  help,
  icon,
  iso,
  label,
  locale,
  mode = 'single',
  name,
  onChange,
  onMonthChange,
  onYearChange,
  optionalLabel,
  required,
  tag,
  value,
  minDate,
  maxDate,
  minTime = '00:00',
  maxTime = '23:59',
  id = name,
  minuteIncrement = 5,
  inline,
  errorLinkRef,
  decorations,
  ...props
}: DateTimeFieldProps): VNode {
  const wrapper = useRef<HTMLDivElement>();
  const internal = useRef<HTMLDivElement>();
  const positionElement = useRef<HTMLDivElement>();
  const [picker, setPicker] = useState<flatpickr.Instance | null>(null);
  const decorationsRef = useRef(decorations);
  decorationsRef.current = decorations;
  const {
    utils: { remap },
  } = useBlock();

  const handleChange = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement>) => {
      if (picker) {
        onChange?.(event, iso ? picker.selectedDates[0].toISOString() : picker.selectedDates[0]);
      } else if (event.currentTarget.value) {
        onChange?.(event, event.currentTarget.value);
      }
    },
    [onChange, picker, iso],
  );

  useEffect(() => {
    if (disabled) {
      return;
    }

    let template = '';
    if (!noCalendar) {
      template += '{date, date, full}';
      if (enableTime) {
        template += ' ';
      }
    }

    if (enableTime) {
      template += '{date, time, short}';
    }

    // @ts-expect-error strictNullChecks not assignable to type
    const p = flatpickr(internal.current, {
      appendTo: wrapper.current,
      enableTime,
      locale,
      noCalendar,
      mode,
      altInput,
      allowInput,
      altFormat,
      static: true,
      positionElement: positionElement.current,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      time_24hr: true,
      wrap: true,
      ...(disable?.length && { disable }),
      minDate,
      maxDate,
      minTime,
      maxTime,
      plugins: confirm ? [confirmDatePlugin({ confirmText: confirmLabel })] : [],
      minuteIncrement,
      formatDate: (date) =>
        remap(
          dateFormat || {
            'string.format': {
              template,
              values: {
                date: { static: date },
              },
            },
          },
          date,
        ) as string,
      onMonthChange(dates: Date[], currentDateString: string, self: flatpickr.Instance) {
        // Convert from 0-indexed (flatpickr) to 1-indexed (user-facing)
        onMonthChange?.({ year: self.currentYear, month: self.currentMonth + 1 });
      },
      onYearChange(dates: Date[], currentDateString: string, self: flatpickr.Instance) {
        // Convert from 0-indexed (flatpickr) to 1-indexed (user-facing)
        onYearChange?.({ year: self.currentYear, month: self.currentMonth + 1 });
      },
      onDayCreate(
        dates: Date[],
        currentDateString: string,
        self: flatpickr.Instance,
        dayElem: HTMLElement & { dateObj: Date },
      ) {
        const { dateObj } = dayElem;
        const matchingDecorations =
          decorationsRef.current?.filter((decoration) =>
            isSameDay(dateObj, parseISO(decoration.date)),
          ) ?? [];

        // One decoration per type
        let hasDot = false;
        let hasOverlay = false;
        let hasBorder = false;

        for (const decoration of matchingDecorations) {
          const type = decoration.type ?? 'dot';

          if (type === 'dot' && !hasDot) {
            hasDot = true;
          } else if (type === 'overlay' && !hasOverlay) {
            hasOverlay = true;
          } else if (type === 'border' && !hasBorder) {
            hasBorder = true;
          } else {
            continue;
          }

          const span = document.createElement('span');
          span.dataset.dateColor = decoration.color ?? 'default';
          span.dataset.decorationType = type;
          span.classList.add(styles.dayDecoration);

          if (decoration.label) {
            span.title = decoration.label;
          }

          if (type === 'border' && decoration.borderStyle) {
            span.style.setProperty('--date-border-style', decoration.borderStyle);
          }

          dayElem.append(span);
        }
      },
    });

    setPicker(p);

    return () => {
      p.destroy();
      setPicker(null);
    };
  }, [
    dateFormat,
    confirm,
    allowInput,
    altFormat,
    altInput,
    confirmLabel,
    disable,
    disabled,
    enableTime,
    locale,
    maxDate,
    maxTime,
    minDate,
    minTime,
    minuteIncrement,
    mode,
    noCalendar,
    remap,
    onMonthChange,
    onYearChange,
  ]);

  // Redraw calendar when decorations change (without destroying the picker)
  useEffect(() => {
    if (picker && decorations) {
      // Trigger a redraw by calling redraw - this will re-invoke onDayCreate for visible days
      picker.redraw();
    }
  }, [picker, decorations]);

  useEffect(() => {
    if (value) {
      picker?.setDate(new Date(value));
    }
  }, [picker, value]);

  return (
    <div
      className={classNames(className, styles.dateDecorations)}
      id="wrapper"
      ref={wrapper as MutableRef<HTMLDivElement>}
    >
      <FormComponent
        error={error}
        help={help}
        icon={icon}
        id={id}
        inline={inline}
        label={label}
        optionalLabel={optionalLabel}
        // @ts-expect-error strictNullChecks not assignable to type
        ref={internal}
        required={required}
        tag={tag}
      >
        {/* @ts-expect-error strictNullChecks not assignable to type */}
        <div ref={positionElement} />
        <Input
          {...props}
          className="is-fullwidth"
          data-input
          disabled={disabled}
          errorLinkRef={errorLinkRef}
          id={id}
          name={name}
          onChange={handleChange}
        />
      </FormComponent>
    </div>
  );
}
