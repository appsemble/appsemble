import { type IconReference } from '@appsemble/lang-sdk';
import classNames from 'classnames';
import {
  cloneElement,
  type ComponentChild,
  type ComponentChildren,
  createContext,
  isValidElement,
  type VNode,
} from 'preact';
import { forwardRef } from 'preact/compat';
import { useContext, useId, useMemo } from 'preact/hooks';

import styles from './index.module.css';
import { FieldError, Icon } from '../index.js';

/**
 * These props are typically inherited by a component that implements `FormComponent`.
 */
export interface SharedFormComponentProps {
  /**
   * An optional class name.
   */
  className?: string;

  /**
   * A Bulma addon to display.
   */
  addon?: ComponentChild;

  /**
   * An additional control node to render right of the form field.
   */
  control?: VNode;

  /**
   * An error message to render. This will also make the help text red.
   */
  error?: ComponentChild;

  /**
   * A help message to render.
   */
  help?: ComponentChild;

  /**
   * A Font Awesome icon or an `icon:<key>` reference to render on the left side of the input.
   */
  icon?: IconReference;

  /**
   * An optional id for the HTML element. If not set, this will fall back to `name`.
   */
  id?: string;

  /**
   * The label element to render.
   */
  label?: ComponentChild;

  /**
   * The label used for optional fields.
   *
   * @default '(Optional)'
   */
  optionalLabel?: ComponentChild;

  /**
   * The name for the HTML element.
   */
  name?: string;

  /**
   * Whether or not the field is required
   */
  required?: boolean;

  /**
   * The tag to display next to the label.
   */
  tag?: ComponentChild;

  /**
   * Combines fields on the same row.
   *
   * Fields are combined in order if set to true.
   */
  inline?: true;
}

export interface FormComponentProps extends SharedFormComponentProps {
  children: ComponentChild;

  /**
   * An extra message to display right of the help text.
   */
  helpExtra?: ComponentChild;

  /**
   * Whether or not the input is required.
   */
  required?: boolean;

  /**
   * Whether or not the help section should be rendered.
   */
  disableHelp?: boolean;
}

/**
 * Where a {@link FormComponent} renders its help text and error message.
 *
 * With `below`, the help text renders below the form controls, and the error message replaces it.
 * With `above`, the help text renders between the label and the form controls, followed by the
 * error message.
 */
export type FormComponentHelpPosition = 'above' | 'below';

/**
 * The position of the help text and error message of the {@link FormComponent} elements inside.
 */
export const FormComponentHelpPositionContext = createContext<FormComponentHelpPosition>('below');

interface FormComponentAria {
  'aria-describedby'?: string;
  'aria-invalid'?: true;
}

/**
 * The accessibility attributes a form control inside a {@link FormComponent} spreads onto itself,
 * so it is described by the help or error text and marked invalid when there is an error.
 */
export const FormComponentContext = createContext<FormComponentAria>({});

interface FormComponentErrorProps {
  /**
   * The form controls to describe by the error.
   */
  readonly children: ComponentChildren;

  /**
   * The error message to render next to the controls.
   */
  readonly error?: ComponentChild;
}

/**
 * Render an error next to form controls that don't show it in the help text of their
 * {@link FormComponent}, and describe the controls by it.
 */
export function FormComponentError({ children, error }: FormComponentErrorProps): VNode {
  const errorId = useId();
  const parentAria = useContext(FormComponentContext);
  const helpAbove = useContext(FormComponentHelpPositionContext) === 'above';
  const hasError = Boolean(error);
  const aria = useMemo<FormComponentAria>(
    () =>
      hasError
        ? {
            ...parentAria,
            'aria-describedby': [parentAria['aria-describedby'], errorId].filter(Boolean).join(' '),
            'aria-invalid': true,
          }
        : parentAria,
    [errorId, hasError, parentAria],
  );

  const errorContent = error ? (
    <FieldError className={classNames({ [styles.above]: helpAbove })} id={errorId}>
      {error}
    </FieldError>
  ) : null;

  return (
    <>
      {helpAbove ? errorContent : null}
      <FormComponentContext.Provider value={aria}>{children}</FormComponentContext.Provider>
      {helpAbove ? null : errorContent}
    </>
  );
}

/**
 * A wrapper for creating consistent form components.
 */
export const FormComponent = forwardRef<HTMLDivElement, FormComponentProps>(
  (
    {
      addon,
      children,
      className,
      control,
      disableHelp,
      error,
      help,
      helpExtra,
      icon,
      id,
      inline,
      label,
      optionalLabel = '(Optional)',
      required,
      tag,
    },
    ref,
  ) => {
    const helpId = useId();
    const errorId = useId();
    const helpAbove = useContext(FormComponentHelpPositionContext) === 'above';
    const hasError = isValidElement(error) || typeof error === 'string' || Number.isFinite(error);
    const aria = useMemo<FormComponentAria>(
      () => ({
        'aria-describedby': disableHelp
          ? undefined
          : helpAbove
            ? [help ? helpId : null, hasError ? errorId : null].filter(Boolean).join(' ') ||
              undefined
            : help || hasError
              ? helpId
              : undefined,
        'aria-invalid': hasError || undefined,
      }),
      [disableHelp, errorId, hasError, help, helpAbove, helpId],
    );

    const helpContent = hasError ? (
      <FieldError className={styles.help} id={helpId}>
        {error}
      </FieldError>
    ) : (
      <span
        className={classNames(`help ${styles.help}`, { 'is-danger': error })}
        data-testid="help-formcomp"
        id={helpId}
      >
        {help}
      </span>
    );

    const controls = (
      <div
        className={classNames(`control ${styles.control}`, {
          'has-icons-left': icon,
          'has-icons-right': control,
        })}
      >
        {icon ? <Icon className="is-left" icon={icon} /> : null}
        <FormComponentContext.Provider value={aria}>{children}</FormComponentContext.Provider>
        {control ? cloneElement(control, { className: 'is-right' }) : null}
      </div>
    );

    return (
      <div
        className={classNames('field', className, { [styles.inline]: inline })}
        data-testid="submit-formcomp"
        ref={ref}
      >
        {label ? (
          <label className="label" data-testid="label-formcomp" htmlFor={id}>
            {label}
            {!required || tag ? (
              <span className="is-pulled-right has-text-weight-normal" data-testid="tag-formcomp">
                {tag || optionalLabel}
              </span>
            ) : null}
          </label>
        ) : null}
        {!disableHelp && helpAbove ? (
          <>
            {help || helpExtra ? (
              <div className={`is-flex ${styles.helpWrapper} ${styles.above}`}>
                <span className={`help ${styles.help}`} data-testid="help-formcomp" id={helpId}>
                  {help}
                </span>
                {helpExtra ? (
                  <span className={`help ml-1 ${styles.counter}`} data-testid="help-extra-formcomp">
                    {helpExtra}
                  </span>
                ) : null}
              </div>
            ) : null}
            {hasError ? (
              <FieldError className={styles.above} id={errorId}>
                {error}
              </FieldError>
            ) : null}
          </>
        ) : null}
        {addon ? (
          <div className="field is-marginless has-addons">
            {controls}
            <label className="control" htmlFor={id}>
              {addon}
            </label>
          </div>
        ) : (
          controls
        )}
        {disableHelp || helpAbove ? null : helpExtra ? (
          <div className={`is-flex ${styles.helpWrapper}`} data-testid>
            {helpContent}
            <span className={`help ml-1 ${styles.counter}`} data-testid="help-extra-formcomp">
              {helpExtra}
            </span>
          </div>
        ) : (
          helpContent
        )}
      </div>
    );
  },
);
