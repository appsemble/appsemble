import { type ReactElement, type ReactNode } from 'react';

interface SchemaDescriptorProps {
  /**
   * The label to describe the property.
   */
  label: ReactElement | string;

  /**
   * The value to render
   */
  children: ReactNode;
}

/**
 * Render an attribute which describes a JSON schema.
 */
export function SchemaDescriptor({ children, label }: SchemaDescriptorProps): ReactElement {
  return (
    <div>
      <span className="has-text-weight-bold mr-1">{label}:</span>
      {children}
    </div>
  );
}
