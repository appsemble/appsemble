import { useEventListener } from '@appsemble/react-components';
import { AppDefinition, BlockManifest } from '@appsemble/types';
import {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import {
  apiUrl,
  blockManifests as initialBlockManifests,
  definition as initialDefinition,
} from '../../utils/settings';

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
  revision: 0,
});

export function AppDefinitionProvider({ children }: AppDefinitionProviderProps): ReactElement {
  const [blockManifests, setBlockManifests] = useState(initialBlockManifests);
  const [definition, setDefinition] = useState(initialDefinition);
  const [revision, setRevision] = useState(0);

  const value = useMemo(
    () => ({ blockManifests, definition, revision }),
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
