import { Content, Loader, Message, useLocationString } from '@appsemble/react-components';
import { type AppMessages } from '@appsemble/types';
import {
  defaultLocale,
  detectLocale,
  has,
  type IntlMessage,
  type MessageGetter,
  normalize,
  objectCache,
} from '@appsemble/utils';
import { memoize } from '@formatjs/fast-memoize';
import axios from 'axios';
import { type Formatters, IntlMessageFormat } from 'intl-messageformat';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { IntlProvider } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';

import { apiUrl, appId, languages } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';

interface IntlMessagesProviderProps {
  readonly children: ReactNode;
}

interface AppMessageContext {
  getMessage: MessageGetter;
  getAppMessage: MessageGetter;
  getBlockMessage: (
    blockVersion: string,
    blockName: string,
    message: IntlMessage,
    prefix?: string,
  ) => IntlMessageFormat;
  appMessageIds: string[];
}

// @ts-expect-error 2345 argument of type is not assignable to parameter of type (strictNullChecks)
const Context = createContext<AppMessageContext>(null);

const formatters = {
  getNumberFormat: memoize(
    (locale: string, opts: Intl.NumberFormatOptions) => new Intl.NumberFormat(locale, opts),
  ),
  getDateTimeFormat: memoize(
    (locale: string, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, opts),
  ),
  getPluralRules: memoize(
    (locale: string, opts: Intl.PluralRulesOptions) => new Intl.PluralRules(locale, opts),
  ),
} as Formatters;

export function AppMessagesProvider({ children }: IntlMessagesProviderProps): ReactNode {
  const { definition } = useAppDefinition();
  const navigate = useNavigate();
  const redirect = useLocationString();
  const { lang } = useParams<{ lang: string }>();

  const messageCache = useMemo(
    () => objectCache((message) => new IntlMessageFormat(message, lang, undefined, { formatters })),
    [lang],
  );
  const [messages, setMessages] = useState<AppMessages['messages']>();
  const [messagesError, setMessagesError] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(true);

  useEffect(() => {
    const defaultLanguage = definition.defaultLanguage || defaultLocale;
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    if (lang === defaultLanguage || languages.includes(lang)) {
      return;
    }
    const preferredLanguage = localStorage.getItem('preferredLanguage');
    const detected =
      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
      (languages.includes(preferredLanguage) && preferredLanguage) ||
      detectLocale(languages, navigator.languages) ||
      defaultLanguage;
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    if (/^[A-Z]/.test(lang) || definition.pages.some((page) => lang === normalize(page.name))) {
      // Someone got linked to a page without a language tag. Redirect them to the same page, but
      // with language set. This is especially important for the OAuth2 callback URL.
      navigate(`/${detected}${redirect}`, { replace: true });
    } else {
      navigate(`/${detected}`, { replace: true });
    }
  }, [definition, navigate, lang, redirect]);

  useEffect(() => {
    const defaultLanguage = definition.defaultLanguage || defaultLocale;
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    if (lang !== defaultLanguage && !languages.includes(lang)) {
      document.documentElement.lang = defaultLocale;
      return;
    }

    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    document.documentElement.lang = lang;
    axios
      .get<AppMessages>(`${apiUrl}/api/apps/${appId}/messages/${lang}`)
      .then(({ data }) => setMessages(data.messages))
      .catch(() => setMessagesError(true))
      .finally(() => setMessagesLoading(false));
  }, [definition, lang]);

  const getMessage = useCallback(
    ({ defaultMessage, id }: IntlMessage) => {
      // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
      const message = has(messages.messageIds, id) ? messages.messageIds[id] : defaultMessage;
      return messageCache(message || `'{${id}}'`);
    },
    [messageCache, messages],
  );

  const getAppMessage = useCallback(
    ({ defaultMessage, id }: IntlMessage) => {
      // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
      const message = has(messages.app, id) ? messages.app[id] : defaultMessage;
      return messageCache(message || `'{${id}}'`);
    },
    [messageCache, messages],
  );

  const getBlockMessage = useCallback(
    (blockName: string, blockVersion: string, { id }: IntlMessage, prefix: string) => {
      const message =
        // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
        (prefix && messages.app?.[`${prefix}.${id}`]) ||
        // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
        messages.blocks?.[blockName]?.[blockVersion]?.[id] ||
        '';
      return messageCache(message);
    },
    [messageCache, messages],
  );

  const value = useMemo(
    () => ({
      getMessage,
      getAppMessage,
      getBlockMessage,
      appMessageIds: messages?.app ? Object.keys(messages.app) : [],
    }),
    [getMessage, getAppMessage, getBlockMessage, messages],
  );

  if (messagesLoading) {
    return <Loader />;
  }

  if (messagesError) {
    return (
      <Content>
        <Message color="danger">There was a problem loading the app.</Message>
      </Content>
    );
  }

  return (
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    <Context.Provider value={value}>
      <IntlProvider
        defaultLocale={defaultLocale}
        // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
        locale={lang}
        // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
        messages={{ ...messages.core, ...messages.app }}
      >
        {children}
      </IntlProvider>
    </Context.Provider>
  );
}

export function useAppMessages(): AppMessageContext {
  return useContext(Context);
}
