import { noop } from '@appsemble/utils';
import {
  createContext,
  type Dispatch,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface PageHeaderContext {
  setHeader: Dispatch<ReactNode>;
}

const Context = createContext<PageHeaderContext>({
  setHeader: noop,
});

interface PageHeaderProviderProps {
  /**
   * The content to render as the page header.
   */
  readonly children: ReactNode;
}

/**
 * A wrapper that renders a header at the top of the page.
 */
export function PageHeaderProvider({ children }: PageHeaderProviderProps): ReactNode {
  const [header, setHeader] = useState<ReactNode>(null);
  return (
    <Context.Provider
      value={useMemo(
        () => ({
          setHeader,
        }),
        [],
      )}
    >
      {header}
      {children}
    </Context.Provider>
  );
}

/**
 * Use a React element as the page header.
 *
 * @param header The React element to use as the page header.
 */
export function usePageHeader(header: ReactNode): void {
  const { setHeader } = useContext(Context);

  useEffect(() => {
    setHeader(header);

    return () => {
      setHeader(null);
    };
  }, [header, setHeader]);
}
