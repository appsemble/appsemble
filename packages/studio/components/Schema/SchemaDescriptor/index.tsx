import { type ReactNode } from 'react';

interface SchemaDescriptorProps {
  /**
   * The label to describe the property.
   */
  readonly label: ReactNode | string;

  /**
   * The value to render
   */
  readonly children: ReactNode;
}

/**
 * Render an attribute which describes a JSON schema.
 */
export function SchemaDescriptor({ children, label }: SchemaDescriptorProps): ReactNode {
  return (
    <div>
      <span className="has-text-weight-bold mr-1">{label}:</span>
      {children}
    </div>
  );
}
