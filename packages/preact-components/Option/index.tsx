import { VNode } from 'preact';

export interface OptionProps {
  /**
   * A user facing label that representes the option.
   */
  children?: string;

  /**
   * Whether or not the option should be hidden if a value has been selected
   */
  hidden?: boolean;

  /**
   * The value that’s represented by this option.
   */
  value: any;
}

/**
 * An option for a `<Select />` component.
 *
 * @see Select
 */
export function Option({ children, hidden, value }: OptionProps): VNode {
  return (
    <option className={hidden ? 'is-hidden' : null} value={value}>
      {children}
    </option>
  );
}
