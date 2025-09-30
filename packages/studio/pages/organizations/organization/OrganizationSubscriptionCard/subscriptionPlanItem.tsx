import { type ReactNode } from 'react';

interface SubscriptionPlanItemProps {
  /**
   * The text to display inside the item.
   */
  readonly text: string;
}

export function SubscriptionPlanItem({ text }: SubscriptionPlanItemProps): ReactNode {
  return (
    <li className="is-flex is-align-items-center" key="professional">
      <span className="icon has-text-info mr-2">
        <i className="fa-solid fa-circle" />
      </span>
      {text}
    </li>
  );
}
