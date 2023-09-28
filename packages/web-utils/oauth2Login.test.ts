import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  appendOAuth2State,
  clearOAuth2State,
  loadOAuth2State,
  startOAuth2Login,
  storageKey,
} from './oauth2Login.js';

afterEach(clearOAuth2State);

describe('startOAuth2Login', () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    Object.defineProperty(window, 'location', { value: { ...window.location } });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation });
  });

  it('should redirect the user', () => {
    startOAuth2Login({
      authorizationUrl: 'https://example.com/authorize',
      clientId: 'test-client-id',
      redirect: '/blocks',
      redirectUrl: '/callback',
      scope: 'email openid profile',
    });
    expect(window.location.href).toBe(
      'https://example.com/authorize?client_id=test-client-id&redirect_uri=http%3A%2F%2Flocalhost%2Fcallback&response_type=code&scope=email+openid+profile&state=ABCDEFGHIJKLMNOPQRSTUVWXYZabcd',
    );
  });

  it('should store the context in sessionStorage', () => {
    startOAuth2Login({
      authorizationUrl: 'https://example.com/authorize',
      clientId: 'test-client-id',
      redirect: '/blocks',
      redirectUrl: '/callback',
      scope: 'email openid profile',
    });
    expect(loadOAuth2State()).toStrictEqual({
      authorizationUrl: 'https://example.com/authorize',
      redirect: '/blocks',
      state: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcd',
    });
  });
});

describe('loadOAuth2State', () => {
  it('should return null when no value is found', () => {
    const result = loadOAuth2State();
    expect(result).toBeNull();
  });

  it('should return null if the value is unparseable', () => {
    sessionStorage.setItem(storageKey, 'invalid json');
    const result = loadOAuth2State();
    expect(result).toBeNull();
  });
});

describe('appendOAuth2State', () => {
  it('should append the new values, preserving the old values', () => {
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({ state: '123', authorizationUrl: 'https://example.com' }),
    );
    appendOAuth2State({ foo: 'bar' });
    const result = loadOAuth2State();
    expect(result).toStrictEqual({
      authorizationUrl: 'https://example.com',
      foo: 'bar',
      state: '123',
    });
  });

  it('should not append values if no session state is present', () => {
    appendOAuth2State({ foo: 'bar' });
    const result = loadOAuth2State();
    expect(result).toBeNull();
  });
});
