import { useEventListener } from '@appsemble/react-components';
import type { AppDefinition, BlockManifest } from '@appsemble/types';
import React, {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import resolveJsonPointers from '../../utils/resolveJsonPointers';
import settings from '../../utils/settings';

interface AppDefinitionContext {
  blockManifests: BlockManifest[];
  definition: AppDefinition;
  revision: number;
}

interface AppDefinitionProviderProps {
  children: ReactNode;
}

function replaceStyle(id: string, style: string): void {
  const oldNode = document.getElementById(id);
  const newNode = document.createElement('style');
  newNode.appendChild(document.createTextNode(style));
  newNode.id = id;

  if (oldNode) {
    document.head.replaceChild(newNode, oldNode);
  } else {
    document.head.appendChild(newNode);
  }
}

const Context = createContext<AppDefinitionContext>(null);

export default function AppDefinitionProvider({
  children,
}: AppDefinitionProviderProps): ReactElement {
  const [blockManifests, setBlockManifests] = useState(settings.blockManifests);
  const [definition, setDefinition] = useState(settings.definition);
  const [revision, setRevision] = useState(0);

  const value = useMemo(() => ({ blockManifests, definition, revision }), [
    blockManifests,
    definition,
    revision,
  ]);

  const onMessage = useCallback(
    ({ data, origin }: MessageEvent) => {
      if (origin === settings.apiUrl && data?.type === 'editor/EDIT_SUCCESS') {
        replaceStyle('appsemble-style-core', data.style);
        replaceStyle('appsemble-style-shared', data.sharedStyle);
        setBlockManifests(data.blockManifests);
        setDefinition(resolveJsonPointers(data.definition) as AppDefinition);
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
