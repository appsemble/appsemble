import { useEventListener } from '@appsemble/react-components';
import {
  type AppDefinition,
  type BlockManifest,
  type ProjectImplementations,
} from '@appsemble/types';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  apiUrl,
  demoMode,
  blockManifests as initialBlockManifests,
  definition as initialDefinition,
  snapshotId,
} from '../../utils/settings.js';

interface AppDefinitionContext {
  blockManifests: BlockManifest[];
  definition: AppDefinition;
  demoMode: boolean;
  revision: number;
  pageManifests?: ProjectImplementations;
  snapshotId?: number;
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
  pageManifests: {} as ProjectImplementations,
  demoMode,
  revision: 0,
  snapshotId,
});

export function AppDefinitionProvider({ children }: AppDefinitionProviderProps): ReactNode {
  const [blockManifests, setBlockManifests] = useState(initialBlockManifests);
  const [definition, setDefinition] = useState(initialDefinition);
  const [revision, setRevision] = useState(0);
  const pageManifests = useRef<ProjectImplementations>({
    events: {
      listen: {
        data: {
          description: '',
        },
      },

      emit: {
        data: {
          description: '',
        },
      },
    },
  });

  const value = useMemo(
    () => ({
      blockManifests,
      definition,
      pageManifests: pageManifests.current,
      revision,
      demoMode,
      snapshotId,
    }),
    [blockManifests, definition, pageManifests, revision],
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

  // @ts-expect-error 2769 No overload matches this call (strictNullChecks)
  useEventListener(window, 'message', onMessage);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAppDefinition(): AppDefinitionContext {
  return useContext(Context);
}
