import { h, VNode } from 'preact';

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
   * This is set by the `<Select />` parent component.
   */
  selected?: boolean;

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
export function Option({ children, hidden, selected, value }: OptionProps): VNode {
  return (
    <option className={hidden ? 'is-hidden' : null} selected={selected} value={value}>
      {children}
    </option>
  );
}
