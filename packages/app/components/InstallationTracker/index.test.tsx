import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/settings.js', () => ({
  displayInstallationPrompt: true,
}));

function createMatchMedia(matches = false): typeof window.matchMedia {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn().mockReturnValue(false),
  }));
}

async function renderTracker(): Promise<void> {
  const { InstallationTracker } = await import('./index.js');

  render(
    <IntlProvider locale="en" messages={{}}>
      <InstallationTracker />
    </IntlProvider>,
  );
}

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: createMatchMedia(false),
  });

  Object.defineProperty(navigator, 'userAgent', {
    configurable: true,
    value:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });

  Object.defineProperty(navigator, 'standalone', {
    configurable: true,
    value: false,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('InstallationTracker', () => {
  it('should not show the prompt when the iOS app is already installed', async () => {
    localStorage.setItem('visitCount', '2');
    Object.defineProperty(navigator, 'standalone', {
      configurable: true,
      value: true,
    });

    await renderTracker();

    expect(
      screen.queryByText(
        'It seems you use the app frequently, you can either install the app from the next prompt or you can install it in the following way:',
      ),
    ).toBeNull();
    expect(localStorage.getItem('visitCount')).toBe('2');
  });

  it('should show manual iOS install steps in Safari browser mode', async () => {
    localStorage.setItem('visitCount', '2');

    await renderTracker();

    expect(screen.getByText('1. Tap the "Share" button (square with an arrow).')).toBeTruthy();
    expect(screen.getByText('2. Scroll down and tap "Add to Home Screen".')).toBeTruthy();
    expect(localStorage.getItem('visitCount')).toBe('3');
  });
});
