import { ComponentChild, h, VNode } from 'preact';

type RadioButtonProps = Omit<h.JSX.HTMLAttributes<HTMLInputElement>, 'onChange'> & {
  children: ComponentChild;

  /**
   * The class used for the wrapper div.
   */
  wrapperClassName?: string;
};

/**
 * A Bulma styled form select element.
 */
export function RadioButton({ children, wrapperClassName, ...props }: RadioButtonProps): VNode {
  const { id } = props;
  return (
    <div className={wrapperClassName}>
      <input {...props} className="is-checkradio" type="radio" />
      <label htmlFor={id}>{children}</label>
    </div>
  );
}
