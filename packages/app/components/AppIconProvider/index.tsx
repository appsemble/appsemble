import { IconProvider } from '@appsemble/preact-components';
import { type ComponentChildren, type VNode } from 'preact';

import { apiUrl, appId, iconAssetIds, passwordToken } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';

interface AppIconProviderProps {
  readonly children: ComponentChildren;
}

/**
 * Provide the app’s icon registry to every `Icon` rendered by the app shell.
 *
 * The registry follows the current app definition, so editor previews pick up edited mappings.
 */
export function AppIconProvider({ children }: AppIconProviderProps): VNode {
  const { definition } = useAppDefinition();

  return (
    <IconProvider
      apiUrl={apiUrl}
      appId={appId}
      assetIds={iconAssetIds}
      passwordToken={passwordToken}
      registry={definition.icons}
    >
      {children}
    </IconProvider>
  );
}
