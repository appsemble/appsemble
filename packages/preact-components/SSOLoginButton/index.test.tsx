import { clearOAuth2State, loadOAuth2State } from '@appsemble/web-utils';
import { fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { SSOLoginButton } from './index.js';

let originalLocation: Location;

beforeEach(() => {
  originalLocation = window.location;
  Object.defineProperty(window, 'location', { value: { ...window.location } });
});

afterEach(() => {
  Object.defineProperty(window, 'location', { value: originalLocation });
  clearOAuth2State();
});

it('should redirect to the authorization URL and stay loading', () => {
  const onClick = vi.fn();
  render(
    <SSOLoginButton
      authorizationUrl="https://example.com/authorize"
      clientId="test-client-id"
      onClick={onClick}
      redirect="/home"
      redirectUrl="/callback"
      scope="email openid"
    >
      Login
    </SSOLoginButton>,
  );
  const button = screen.getByRole('button', { name: 'Login' });

  fireEvent.click(button);

  const url = new URL(window.location.href);
  expect(url.origin + url.pathname).toBe('https://example.com/authorize');
  expect(url.searchParams.get('client_id')).toBe('test-client-id');
  expect(url.searchParams.get('scope')).toBe('email openid');
  expect(loadOAuth2State().redirect).toBe('/home');
  expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));
  expect(button.classList.contains('is-loading')).toBe(true);
});
