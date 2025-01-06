import { ModalCard, useToggle } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const visitCountKey = 'visitCount';
const lastPromptTimeKey = 'lastPromptTime';

const visitThreshold = 3;
const cooldownPeriod = 5 * 24 * 60 * 60 * 1000;

const visitCountString = localStorage.getItem(visitCountKey) || '0';
const visitCount = Number.parseInt(visitCountString);
localStorage.setItem(visitCountKey, String(visitCount + 1));

const currentTime = Date.now();
const lastPromptTimeString = localStorage.getItem(lastPromptTimeKey) || '0';
const lastPromptTime = Number.parseInt(lastPromptTimeString);

const showInstallationPrompt =
  visitCount + 1 >= visitThreshold &&
  (!lastPromptTime || currentTime - lastPromptTime > cooldownPeriod);

const promptSupported = 'onbeforeinstallprompt' in window;

function setPrompted(): void {
  localStorage.setItem(visitCountKey, '0');
  localStorage.setItem(lastPromptTimeKey, String(currentTime));
}

if (showInstallationPrompt && promptSupported) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    const prompt = e as BeforeInstallPromptEvent;
    document.body.addEventListener(
      'click',
      async () => {
        await prompt.prompt();
        await prompt.userChoice;
        setPrompted();
      },
      { once: true },
    );
  });
}

const userAgent = navigator.userAgent.toLowerCase();

const isApple = userAgent.includes('iphone') || userAgent.includes('ipad');
const isAndroid = userAgent.includes('android');

export function InstallationTracker(): ReactNode {
  const promptToggle = useToggle(true);

  if (promptSupported || !showInstallationPrompt || !promptToggle.enabled) {
    return null;
  }

  const closePrompt = (): void => {
    promptToggle.disable();
    setPrompted();
  };

  return (
    <ModalCard isActive={promptToggle.enabled} onClose={closePrompt}>
      <div>
        <p className="mb-2">
          <FormattedMessage {...messages.bannerTitle} />
        </p>
        {isApple ? (
          <ul>
            <li className="mb-2">
              <FormattedMessage {...messages.bannerAppleStep1} />
            </li>
            <li>
              <FormattedMessage {...messages.bannerAppleStep2} />
            </li>
          </ul>
        ) : null}
        {isAndroid ? (
          <ul>
            <li className="mb-2">
              <FormattedMessage {...messages.bannerAndroidStep1} />
            </li>
            <li>
              <FormattedMessage {...messages.bannerAndroidStep2} />
            </li>
          </ul>
        ) : null}
        {!isApple && !isAndroid ? (
          <ul>
            <li className="mb-2">
              <FormattedMessage {...messages.bannerGenericStep1} />
            </li>
            <li>
              <FormattedMessage {...messages.bannerGenericStep2} />
            </li>
          </ul>
        ) : null}
      </div>
    </ModalCard>
  );
}
