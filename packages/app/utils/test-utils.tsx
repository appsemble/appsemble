import { IconProvider } from '@appsemble/preact-components';
import { type ComponentChildren, type VNode } from 'preact';

/**
 * Provide an app without a custom icon registry to the components rendered in a test.
 */
export function IconTestWrapper({ children }: { readonly children: ComponentChildren }): VNode {
  return (
    <IconProvider apiUrl="https://example.com" appId={42} registry={undefined}>
      {children}
    </IconProvider>
  );
}
