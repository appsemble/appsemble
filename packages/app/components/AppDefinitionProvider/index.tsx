import { useEventListener } from '@appsemble/react-components';
import { type AppDefinition, type BlockManifest } from '@appsemble/types';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import {
  apiUrl,
  demoMode,
  blockManifests as initialBlockManifests,
  definition as initialDefinition,
} from '../../utils/settings.js';

interface AppDefinitionContext {
  blockManifests: BlockManifest[];
  definition: AppDefinition;
  demoMode: boolean;
  revision: number;
}

interface AppDefinitionProviderProps {
  readonly children: ReactNode;
}

function replaceStyle(id: string, style: string): void {
  const oldNode = document.getElementById(id);
  const newNode = document.createElement('style');
  newNode.append(document.createTextNode(style));
  newNode.id = id;

  if (oldNode) {
    document.head.replaceChild(newNode, oldNode);
  } else {
    document.head.append(newNode);
  }
}

const Context = createContext<AppDefinitionContext>({
  definition: initialDefinition,
  blockManifests: initialBlockManifests,
  demoMode,
  revision: 0,
});

export function AppDefinitionProvider({ children }: AppDefinitionProviderProps): ReactNode {
  const [blockManifests, setBlockManifests] = useState(initialBlockManifests);
  const [definition, setDefinition] = useState(initialDefinition);
  const [revision, setRevision] = useState(0);

  const value = useMemo(
    () => ({ blockManifests, definition, revision, demoMode }),
    [blockManifests, definition, revision],
  );

  const onMessage = useCallback(
    ({ data, origin }: MessageEvent) => {
      if (origin === apiUrl && data?.type === 'editor/EDIT_SUCCESS') {
        replaceStyle('appsemble-style-core', data.coreStyle);
        replaceStyle('appsemble-style-shared', data.sharedStyle);
        setBlockManifests(data.blockManifests);
        setDefinition(data.definition);
        setRevision(revision + 1);
      } else if (origin === apiUrl && data?.type === 'editor/gui/EDIT_SUCCESS') {
        replaceStyle('appsemble-style-core', data.coreStyle);
        replaceStyle('appsemble-style-shared', data.sharedStyle);
        setDefinition(data.definition);
        setRevision(revision + 1);
      }
    },
    [revision],
  );

  useEventListener(window, 'message', onMessage);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAppDefinition(): AppDefinitionContext {
  return useContext(Context);
}
