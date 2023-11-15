import { noop } from '@appsemble/utils';
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';

type BreadCrumbsDecorationContext = [ReactNode, Dispatch<SetStateAction<ReactNode>>];

const Context = createContext<BreadCrumbsDecorationContext>([null, noop]);

export interface BreadCrumbsDecorationProviderProps {
  readonly children: ReactNode;
}

export function BreadCrumbsDecorationProvider({
  children,
}: BreadCrumbsDecorationProviderProps): ReactNode {
  const [value, setValue] = useState<ReactNode>(null);

  return (
    <Context.Provider value={useMemo(() => [value, setValue], [value])}>
      {children}
    </Context.Provider>
  );
}

export function useBreadCrumbsDecoration(): BreadCrumbsDecorationContext {
  return useContext(Context);
}
