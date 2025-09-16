import { type VNode } from 'preact';

export interface OptionProps {
  /**
   * A user facing label that represents the option.
   */
  readonly children?: string;

  /**
   * Whether or not the option is disabled.
   */
  readonly disabled?: boolean;

  /**
   * Whether or not the option should be hidden if a value has been selected
   */
  readonly hidden?: boolean;

  /**
   * The value that’s represented by this option.
   */
  readonly value: any;
}

/**
 * An option for a `<Select />` component.
 *
 * @see Select
 */
export function Option({ hidden, ...props }: OptionProps): VNode {
  return <option className={hidden ? 'is-hidden' : undefined} {...props} />;
}
