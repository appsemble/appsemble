import { Content, Loader, Message, useLocationString } from '@appsemble/react-components';
import type { AppMessages } from '@appsemble/types';
import { IntlMessage, MessageGetter, normalize } from '@appsemble/utils';
import axios from 'axios';
import memoizeIntlConstructor from 'intl-format-cache';
import IntlMessageFormat from 'intl-messageformat';
import React, {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { detectLocale } from '../../utils/i18n';
import settings from '../../utils/settings';
import { useAppDefinition } from '../AppDefinitionProvider';

interface IntlMessagesProviderProps {
  children: ReactNode;
}

const Context = createContext<MessageGetter>(null);

const formatters = {
  getNumberFormat: memoizeIntlConstructor(Intl.NumberFormat),
  getDateTimeFormat: memoizeIntlConstructor(Intl.DateTimeFormat),
  getPluralRules: memoizeIntlConstructor(Intl.PluralRules),
};

export default function AppMessagesProvider({ children }: IntlMessagesProviderProps): ReactElement {
  const { lang } = useParams<{ lang: string }>();
  const { definition } = useAppDefinition();
  const history = useHistory();
  const redirect = useLocationString();

  const [messages, setMessages] = useState<AppMessages['messages']>();
  const messageCache = useMemo(
    () => new Map<string, IntlMessageFormat>(),
    // Reset the message cache if the language is updated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang],
  );
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const defaultLanguage = definition.defaultLanguage || 'en';
    if (lang !== defaultLanguage && !settings.languages.includes(lang)) {
      const detected = detectLocale(settings.languages, navigator.languages) || defaultLanguage;
      if (/^[A-Z]/.exec(lang) || definition.pages.find((page) => lang === normalize(page.name))) {
        // Someone got linked to a page without a language tag. Redirect them to the same page, but
        // with language set. This is especially important for the OAuth2 callback URL.
        history.replace(`/${detected}${redirect}`);
      } else {
        history.replace(`/${detected}`);
      }
      return;
    }

    axios
      .get<AppMessages>(`${settings.apiUrl}/api/apps/${settings.id}/messages/${lang}`)
      .then(({ data }) => setMessages(data.messages))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [definition, history, lang, redirect]);

  const getMessage = useCallback(
    ({ defaultMessage, id }: IntlMessage) => {
      const message = Object.hasOwnProperty.call(messages, id) ? messages[id] : defaultMessage;
      let messageFormat = messageCache.get(message);
      if (!messageFormat) {
        messageFormat = new IntlMessageFormat(message, lang, undefined, { formatters });
        messageCache.set(message, messageFormat);
      }
      return messageFormat;
    },
    [lang, messageCache, messages],
  );

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <Content>
        <Message color="danger">There was a problem loading the app.</Message>
      </Content>
    );
  }

  return <Context.Provider value={getMessage}>{children}</Context.Provider>;
}

export function useAppMessages(): MessageGetter {
  return useContext(Context);
}
