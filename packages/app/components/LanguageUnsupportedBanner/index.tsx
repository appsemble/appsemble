import { Button, Message } from '@appsemble/react-components';
import { type ReactNode, useCallback, useMemo, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { supportedLanguages } from '../../utils/settings.js';

export function LanguageUnsupportedBanner(): ReactNode {
  const { lang } = useParams();
  const supportedLanguagesString = supportedLanguages.join(', ');
  const divRef = useRef<HTMLDivElement>(null);
  const onClickDismiss = useCallback(() => {
    localStorage.setItem(`dismissedBanner-${lang}`, 'true');
    window.location.reload();
  }, [lang]);
  const dismissedBanner = useMemo(
    () => localStorage.getItem(`dismissedBanner-${lang}`) === 'true',
    [lang],
  );
  return dismissedBanner || supportedLanguages.includes(lang!) ? null : (
    <Message color="warning">
      <div className="is-flex is-justify-content-space-between is-align-items-center" ref={divRef}>
        <span>
          <FormattedMessage
            values={{ lang, supportedLanguages: supportedLanguagesString }}
            {...messages.notSupported}
          />
        </span>
        <Button icon="xmark" iconSize="small" onClick={onClickDismiss} />
      </div>
    </Message>
  );
}
