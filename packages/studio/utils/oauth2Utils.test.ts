import { oauth2Redirect, verifyOAuth2LoginRequest } from './oauth2Utils.js';

let originalLocation: Location;

beforeEach(() => {
  originalLocation = window.location;
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { assign: jest.fn() },
  });
});

afterEach(() => {
  window.location = originalLocation;
});

describe('oauth2Redirect', () => {
  it('should throw if redirect_uri is missing', () => {
    const qs = new URLSearchParams();
    expect(() => oauth2Redirect(qs, {})).toThrow(new Error('Invalid URL: null'));
  });

  it('should throw if redirect_uri is invalid', () => {
    const qs = new URLSearchParams({
      redirect_uri: 'bad',
    });
    expect(() => oauth2Redirect(qs, {})).toThrow(new Error('Invalid URL: bad'));
  });

  it('should strip the hash and query parameters from redirect_uri', () => {
    const qs = new URLSearchParams({
      redirect_uri: 'https://example.com/callback?query=true#hashtag',
    });
    oauth2Redirect(qs, { error: 'invalid_request' });
    expect(window.location.assign).toHaveBeenCalledWith(
      'https://example.com/callback?error=invalid_request',
    );
  });
});

describe('verifyOAuth2LoginRequest', () => {
  it('should redirect the user if response_type is missing', () => {
    const qs = new URLSearchParams({
      client_id: 'client',
      redirect_uri: 'https://example.com/callback',
      scope: 'allowed',
      state: 'randomstring',
    });
    const result = verifyOAuth2LoginRequest(qs, ['allowed']);
    expect(window.location.assign).toHaveBeenCalledWith(
      'https://example.com/callback?error=invalid_request&state=randomstring',
    );
    expect(result).toBe(false);
  });

  it('should redirect the user if client_id is missing', () => {
    const qs = new URLSearchParams({
      redirect_uri: 'https://example.com/callback',
      response_type: 'code',
      scope: 'allowed',
      state: 'randomstring',
    });
    const result = verifyOAuth2LoginRequest(qs, ['allowed']);
    expect(window.location.assign).toHaveBeenCalledWith(
      'https://example.com/callback?error=invalid_request&state=randomstring',
    );
    expect(result).toBe(false);
  });

  it('should redirect the user if scope is missing', () => {
    const qs = new URLSearchParams({
      client_id: 'client',
      redirect_uri: 'https://example.com/callback',
      response_type: 'code',
      state: 'randomstring',
    });
    const result = verifyOAuth2LoginRequest(qs, ['allowed']);
    expect(window.location.assign).toHaveBeenCalledWith(
      'https://example.com/callback?error=invalid_request&state=randomstring',
    );
    expect(result).toBe(false);
  });

  it('should redirect the user if state is missing', () => {
    const qs = new URLSearchParams({
      client_id: 'client',
      redirect_uri: 'https://example.com/callback',
      response_type: 'code',
      scope: 'allowed',
    });
    const result = verifyOAuth2LoginRequest(qs, ['allowed']);
    expect(window.location.assign).toHaveBeenCalledWith(
      'https://example.com/callback?error=invalid_request',
    );
    expect(result).toBe(false);
  });

  it('should redirect the user if response_type is invalid', () => {
    const qs = new URLSearchParams({
      client_id: 'client',
      redirect_uri: 'https://example.com/callback',
      response_type: 'implicit',
      scope: 'allowed',
      state: 'randomstring',
    });
    const result = verifyOAuth2LoginRequest(qs, ['allowed']);
    expect(window.location.assign).toHaveBeenCalledWith(
      'https://example.com/callback?error=unsupported_response_type&state=randomstring',
    );
    expect(result).toBe(false);
  });

  it('should redirect the user if any of the requested scopes is not allowed', () => {
    const qs = new URLSearchParams({
      client_id: 'client',
      redirect_uri: 'https://example.com/callback',
      response_type: 'code',
      scope: 'not allowed',
      state: 'randomstring',
    });
    const result = verifyOAuth2LoginRequest(qs, ['allowed']);
    expect(window.location.assign).toHaveBeenCalledWith(
      'https://example.com/callback?error=invalid_scope&state=randomstring',
    );
    expect(result).toBe(false);
  });

  it('should return true if the request is valid', () => {
    const qs = new URLSearchParams({
      client_id: 'client',
      redirect_uri: 'https://example.com/callback',
      response_type: 'code',
      scope: 'allowed',
      state: 'randomstring',
    });
    const result = verifyOAuth2LoginRequest(qs, ['allowed', 'also:ok']);
    expect(window.location.assign).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });
});
