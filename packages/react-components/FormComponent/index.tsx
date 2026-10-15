import { type IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import {
  cloneElement,
  createContext,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useContext,
  useId,
  useMemo,
} from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { FieldError, Icon } from '../index.js';

/**
 * These props are typically inherited by a component that implements `FormComponent`.
 */
export interface SharedFormComponentProps {
  /**
   * A Bulma addon to display left of the field.
   */
  readonly addonLeft?: ReactNode;

  /**
   * A Bulma addon to display right of the field.
   */
  readonly addonRight?: ReactNode;

  /**
   * An additional control node to render right of the form field.
   */
  // eslint-disable-next-line @typescript-eslint/no-restricted-types
  readonly control?: ReactElement;

  /**
   * An error message to render. This will also make the help text red.
   */
  readonly error?: ReactNode;

  /**
   * A help message to render.
   */
  readonly help?: ReactNode;

  /**
   * A fontawesome icon to render on the left side of the input.
   */
  readonly icon?: IconName;

  /**
   * The label element to render.
   */
  readonly label?: ReactNode;
}

export interface FormComponentProps extends SharedFormComponentProps {
  readonly children: ReactNode;

  /**
   * A class name to pass to the field element.
   */
  readonly className?: string;

  /**
   * An optional id for the HTML element. If not set, this will fall back to `name`.
   */
  readonly id?: string;

  /**
   * An extra message to display right of the help text.
   */
  readonly helpExtra?: ReactNode;

  /**
   * Whether or not the input is required.
   */
  readonly required?: boolean;
}

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
  readonly children: ReactNode;

  /**
   * The error message to render below the controls.
   */
  readonly error?: ReactNode;
}

/**
 * Render an error below form controls that don't show it in the help text of their
 * {@link FormComponent}, and describe the controls by it.
 */
export function FormComponentError({ children, error }: FormComponentErrorProps): ReactNode {
  const errorId = useId();
  const parentAria = useContext(FormComponentContext);
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

  return (
    <>
      <FormComponentContext.Provider value={aria}>{children}</FormComponentContext.Provider>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </>
  );
}

/**
 * A wrapper for creating consistent form components.
 */
export function FormComponent({
  addonLeft,
  addonRight,
  children,
  className,
  control,
  error,
  help,
  helpExtra,
  icon,
  id,
  label,
  required,
}: FormComponentProps): ReactNode {
  const helpId = useId();
  const hasErrorMessage =
    isValidElement(error) || typeof error === 'string' || Number.isFinite(error);
  const hasHelpText = hasErrorMessage || Boolean(help);
  const hasError = Boolean(error);
  const aria = useMemo<FormComponentAria>(
    () => ({
      'aria-describedby': hasHelpText ? helpId : undefined,
      'aria-invalid': hasError || undefined,
    }),
    [hasError, hasHelpText, helpId],
  );

  const helpContent = hasErrorMessage ? (
    <FieldError className={styles.help} id={helpId}>
      {error}
    </FieldError>
  ) : (
    <span className={classNames(`help ${styles.help}`, { 'is-danger': error })} id={helpId}>
      {help}
    </span>
  );

  const controls = (
    <div
      className={classNames('control', styles.control, className, {
        'has-icons-left': icon,
        'has-icons-right': control,
      })}
    >
      <FormComponentContext.Provider value={aria}>{children}</FormComponentContext.Provider>
      {icon ? <Icon className="is-left" icon={icon} /> : null}
      {control ? cloneElement(control, { className: 'is-right' }) : null}
    </div>
  );

  return (
    <div className={classNames('field', className)}>
      {label ? (
        <label className="label" htmlFor={id}>
          {label}
          {required || (
            <span className="is-pulled-right has-text-weight-normal">
              (<FormattedMessage {...messages.optional} />)
            </span>
          )}
        </label>
      ) : null}
      {addonLeft || addonRight ? (
        <div className="field is-marginless has-addons">
          {addonLeft ? <div className="control">{addonLeft}</div> : null}
          {controls}
          {addonRight ? <div className="control">{addonRight}</div> : null}
        </div>
      ) : (
        controls
      )}
      {helpExtra ? (
        <div className={`is-flex ${styles.helpWrapper}`}>
          {helpContent}
          <span className={`help ml-1 ${styles.counter}`}>{helpExtra}</span>
        </div>
      ) : (
        helpContent
      )}
    </div>
  );
}
