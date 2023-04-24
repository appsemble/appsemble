import { type VNode } from 'preact';

export interface OptionProps {
  /**
   * A user facing label that represents the option.
   */
  children?: string;

  /**
   * Whether or not the option is disabled.
   */
  disabled?: boolean;

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
export function Option({ hidden, ...props }: OptionProps): VNode {
  return <option className={hidden ? 'is-hidden' : null} {...props} />;
}
