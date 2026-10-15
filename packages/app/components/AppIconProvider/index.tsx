import { IconProvider } from '@appsemble/react-components';
import { type ReactNode } from 'react';

import { apiUrl, appId } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';

interface AppIconProviderProps {
  readonly children: ReactNode;
}

/**
 * Provide the app’s icon registry to every `Icon` rendered by the app shell.
 *
 * The registry follows the current app definition, so editor previews pick up edited mappings.
 */
export function AppIconProvider({ children }: AppIconProviderProps): ReactNode {
  const { definition } = useAppDefinition();

  return (
    <IconProvider apiUrl={apiUrl} appId={appId} registry={definition.icons}>
      {children}
    </IconProvider>
  );
}
