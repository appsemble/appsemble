import {
  createIntl,
  createIntlCache,
  type IntlConfig,
  type IntlShape,
  type MessageDescriptor,
} from '@formatjs/intl';
import { type FormatXMLElementFn, type PrimitiveType } from 'intl-messageformat';
import { type ComponentChild, type ComponentChildren, createContext, type VNode } from 'preact';
import { useContext, useMemo } from 'preact/hooks';

/**
 * The intl object of the surrounding `IntlProvider`, or `null` outside of one.
 */
export const IntlContext = createContext<IntlShape<ComponentChild> | null>(null);

const cache = createIntlCache();

interface IntlProviderProps extends Pick<IntlConfig, 'locale' | 'messages'> {
  readonly children: ComponentChildren;
}

/**
 * Format messages in the given locale for the components rendered inside.
 */
export function IntlProvider({ children, locale, messages }: IntlProviderProps): VNode {
  const intl = useMemo(
    () => createIntl<ComponentChild>({ locale, messages }, cache),
    [locale, messages],
  );

  return <IntlContext.Provider value={intl}>{children}</IntlContext.Provider>;
}

export function useIntl(): IntlShape<ComponentChild> {
  const intl = useContext(IntlContext);
  if (!intl) {
    throw new Error('useIntl must be used inside an IntlProvider');
  }
  return intl;
}

interface FormattedMessageProps extends MessageDescriptor {
  /**
   * The values of the message placeholders. Components render in place of their placeholder, and
   * functions render the content of their tag.
   */
  readonly values?: Record<
    string,
    ComponentChild | FormatXMLElementFn<ComponentChild> | PrimitiveType
  >;
}

/**
 * Render a message formatted by the surrounding `IntlProvider`.
 */
export function FormattedMessage({ values, ...descriptor }: FormattedMessageProps): VNode {
  const { formatMessage } = useIntl();

  return <>{formatMessage(descriptor, values)}</>;
}
