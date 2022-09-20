import { noop } from '@appsemble/utils';
import {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MessageDescriptor, useIntl } from 'react-intl';
import { Routes, useLocation } from 'react-router-dom';

type Text = MessageDescriptor | string;

interface Breadcrumb {
  /**
   * The URL represented by the breadcrumb.
   */
  url: string;

  /**
   * The page title represented by the breadcrumb.
   */
  title: string;

  /**
   * The page description represented by the breadcrumb.
   */
  description: string;
}

type SetMeta = (depth: number, breadcrumb?: Breadcrumb) => void;
type ContextType = [number, SetMeta];

const MetaContext = createContext<ContextType>([0, noop]);
const BreadcrumbContext = createContext<Breadcrumb[]>([]);

interface MetaProviderProps {
  /**
   * Children to be rendered within the context of this provider.
   */
  children: ReactNode;

  /**
   * The default page description.
   */
  description: Text;

  /**
   * The top level title to use.
   */
  title: string;
}

/**
 * A provider for breadcrumbs and page metadata.
 */
export function MetaProvider({ children, description, title }: MetaProviderProps): ReactElement {
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const descriptionNode = useRef<HTMLMetaElement>();
  const { formatMessage } = useIntl();

  const setMeta = useCallback<SetMeta>((index, newValue) => {
    setBreadcrumbs((oldValues) => {
      const oldValue = oldValues[index];
      if (newValue?.title === oldValue?.title && newValue?.url === oldValue?.url) {
        return oldValues;
      }
      const newValues = [...oldValues];
      newValues[index] = newValue;
      return newValues;
    });
  }, []);

  useEffect(() => {
    document.title = breadcrumbs.reduce(
      (acc, breadcrumb) => (breadcrumb?.title ? `${breadcrumb.title} · ${acc}` : acc),
      title,
    );
  }, [breadcrumbs, title]);

  useEffect(() => {
    if (!descriptionNode.current) {
      descriptionNode.current = document.createElement('meta');
      descriptionNode.current.name = 'description';
      document.head.append(descriptionNode.current);
    }
    const descriptions = breadcrumbs.map((breadcrumb) => breadcrumb?.description).filter(Boolean);
    descriptionNode.current.content = descriptions.length
      ? descriptions[descriptions.length - 1]
      : typeof description === 'string'
      ? description
      : formatMessage(description);
  }, [breadcrumbs, description, formatMessage]);

  return (
    <MetaContext.Provider value={useMemo(() => [0, setMeta], [setMeta])}>
      <BreadcrumbContext.Provider value={breadcrumbs}>{children}</BreadcrumbContext.Provider>
    </MetaContext.Provider>
  );
}

/**
 * Use the breadcrumbs that have currently been registered.
 *
 * @returns The currently active breadcrumbs
 */
export function useBreadcrumbs(): Breadcrumb[] {
  return useContext(BreadcrumbContext).filter(Boolean);
}

/**
 * Define a title and description for a page.
 *
 * @param title The page title to use. This will be used for both a breadcrumb and as part of the
 * page title.
 * @param description The page description to use. This is used for SEO purposes only. Therefor
 * it’s only needed for public pages.
 */
export function useMeta(title: Text, description?: Text): void {
  const [depth, setMeta] = useContext(MetaContext);
  const { formatMessage } = useIntl();

  const { pathname } = useLocation();
  // Don't count empty string and language segments
  const segmentCount = pathname.split('/').length - 2;
  const url = pathname + '/..'.repeat(segmentCount > 1 ? segmentCount - depth - 1 : 0);

  useEffect(() => {
    const formatMaybe = (string: Text): string =>
      string ? (typeof string === 'string' ? string : formatMessage(string)) : undefined;

    setMeta(depth, {
      description: formatMaybe(description),
      title: formatMaybe(title),
      url,
    });

    return () => setMeta(depth);
  }, [depth, description, formatMessage, setMeta, title, url]);
}

interface MetaSwitchProps {
  /**
   * Child routes to render.
   */
  children: ReactNode;

  /**
   * The page description to use.
   */
  description?: Text;

  /**
   * The page title to use.
   */
  title?: Text;
}

/**
 * Render a React router switch and a new level for breadcrumb metadata.
 */
export function MetaSwitch({ children, description, title }: MetaSwitchProps): ReactElement {
  const [depth, setMeta] = useContext(MetaContext);
  useMeta(title, description);

  return (
    <MetaContext.Provider value={useMemo(() => [depth + 1, setMeta], [depth, setMeta])}>
      <Routes>{children}</Routes>
    </MetaContext.Provider>
  );
}
