import { type ComponentProps } from 'preact';
import { forwardRef } from 'preact/compat';

import { DualSlider, FormComponent, Icon, type SharedFormComponentProps } from '../index.js';

type DualSliderFieldProps = Omit<
  ComponentProps<typeof DualSlider>,
  keyof SharedFormComponentProps
> &
  SharedFormComponentProps & {
    /**
     * Labels to display evenly spaced below the slider.
     */
    bottomLabels?: (number | string)[];

    /**
     * Labels to display evenly spaced on top of the slider.
     */
    topLabels?: (number | string)[];
  };

/**
 * A Bulma styled form input element.
 */
export const DualSliderField = forwardRef<HTMLInputElement, DualSliderFieldProps>(
  (
    {
      addon,
      bottomLabels,
      className,
      control,
      error,
      icon,
      help,
      label,
      maxLength,
      name,
      value,
      id = name,
      tag,
      topLabels,
      optionalLabel,
      inline,
      ...props
    },
    ref,
  ) => (
    <FormComponent
      addon={addon}
      className={className}
      control={control}
      error={error}
      help={help}
      helpExtra={maxLength ? `${value == null ? 0 : String(value).length} / ${maxLength}` : null}
      id={id}
      inline={inline}
      label={label}
      optionalLabel={optionalLabel}
      required
      tag={tag}
    >
      {topLabels?.length ? (
        <div class={`is-flex is-justify-content-space-between${icon ? ' ml-5' : ''}`}>
          {topLabels.map((topLabel) => (
            <span key={topLabel}>{topLabel}</span>
          ))}
        </div>
      ) : null}
      {icon ? (
        <div class="is-flex is-justify-content-space-between">
          <Icon className="is-left" icon={icon} />
          <DualSlider
            {...props}
            error={Boolean(error)}
            hasIcon
            id={id}
            maxLength={maxLength}
            name={name}
            ref={ref}
            value={value}
          />
        </div>
      ) : (
        <DualSlider
          {...props}
          error={Boolean(error)}
          id={id}
          maxLength={maxLength}
          name={name}
          ref={ref}
          value={value}
        />
      )}
      {bottomLabels?.length ? (
        <div class={`is-flex is-justify-content-space-between${icon ? ' ml-5' : ''}`}>
          {bottomLabels.map((bottomLabel) => (
            <span key={bottomLabel}>{bottomLabel}</span>
          ))}
        </div>
      ) : null}
    </FormComponent>
  ),
);
