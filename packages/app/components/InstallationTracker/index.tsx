import { ModalCard, useToggle } from '@appsemble/react-components';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { displayInstallationPrompt } from '../../utils/settings.js';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const userAgent = navigator.userAgent.toLowerCase();
const isIOS = /iphone|ipad|ipod/.test(userAgent);
const isAndroid = /android/.test(userAgent);
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export function InstallationTracker(): ReactNode {
  const promptToggle = useToggle(true);
  const hasPromptedRef = useRef(false);
  const [showPrompt, setShowPrompt] = useState(false);

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
    displayInstallationPrompt &&
    (!lastPromptTime || currentTime - lastPromptTime > cooldownPeriod);

  const promptSupported = 'onbeforeinstallprompt' in window;

  const setPrompted = useCallback(() => {
    localStorage.setItem(visitCountKey, '0');
    localStorage.setItem(lastPromptTimeKey, String(currentTime));
    hasPromptedRef.current = true;
    setShowPrompt(false);
  }, [currentTime]);

  useEffect(() => {
    if (showInstallationPrompt && promptSupported && !hasPromptedRef.current) {
      const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent): void => {
        e.preventDefault();
        const prompt = e;
        setShowPrompt(true);

        document.body.addEventListener(
          'click',
          async () => {
            await prompt.prompt();
            await prompt.userChoice;
            setPrompted();
          },
          { once: true },
        );
      };

      // @ts-expect-error beforeinstallprompt not keyof WindowEventMap
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        // @ts-expect-error beforeinstallprompt not keyof WindowEventMap
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, [setPrompted, showInstallationPrompt, promptSupported]);

  // Always show manual instructions on Safari iOS (ignores beforeinstallprompt).
  const shouldShowSafariIOS = isIOS && isSafari && showInstallationPrompt;
  // Show explicit unsupported message on Safari desktop.
  const shouldShowSafariDesktop = !isIOS && isSafari && showInstallationPrompt;

  if (
    (!promptSupported && !shouldShowSafariIOS && !shouldShowSafariDesktop) ||
    !showInstallationPrompt ||
    !promptToggle.enabled ||
    (!showPrompt && !shouldShowSafariIOS && !shouldShowSafariDesktop)
  ) {
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
        {shouldShowSafariIOS ? (
          <ul>
            <li className="mb-2">
              <FormattedMessage {...messages.bannerAppleStep1} />
            </li>
            <li>
              <FormattedMessage {...messages.bannerAppleStep2} />
            </li>
          </ul>
        ) : null}
        {isAndroid && promptSupported && showPrompt ? (
          <ul>
            <li className="mb-2">
              <FormattedMessage {...messages.bannerAndroidStep1} />
            </li>
            <li>
              <FormattedMessage {...messages.bannerAndroidStep2} />
            </li>
          </ul>
        ) : null}
        {shouldShowSafariDesktop ? (
          <p>
            <FormattedMessage {...messages.bannerSafariDesktopUnsupported} />
          </p>
        ) : null}
        {!isIOS && !isAndroid && !isSafari && showPrompt ? (
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
