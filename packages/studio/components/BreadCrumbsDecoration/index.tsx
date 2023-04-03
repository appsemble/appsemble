import { noop } from '@appsemble/utils';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';
import { ReactElement } from 'rehype-react/lib';

type BreadCrumbsDecorationContext = [ReactNode, Dispatch<SetStateAction<ReactNode>>];

const Context = createContext<BreadCrumbsDecorationContext>([null, noop]);

export interface BreadCrumbsDecorationProviderProps {
  children: ReactNode;
}

export function BreadCrumbsDecorationProvider({
  children,
}: BreadCrumbsDecorationProviderProps): ReactElement {
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
