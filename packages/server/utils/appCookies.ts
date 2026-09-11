import { type Context } from 'koa';

export const APP_REFRESH_TOKEN_COOKIE_NAME = 'app_refresh_token';

export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

function getCookieOptions(path: string): {
  httpOnly: boolean;
  path: string;
  sameSite: 'lax' | 'none';
  secure: boolean;
  signed: boolean;
  maxAge: number;
  partitioned?: true;
} {
  return {
    httpOnly: true,
    path,
    sameSite: 'none',
    secure: true,
    signed: true,
    maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
    partitioned: true,
  };
}

/**
 * Set a cookie while bypassing Koa's "Cannot send secure cookie over unencrypted connection" check.
 * This is necessary when Appsemble runs behind TLS termination and argv.host is HTTPS, but Koa
 * sees the upstream request as plain HTTP.
 *
 * @param ctx The Koa context.
 * @param name The name of the cookie.
 * @param value The value of the cookie.
 * @param options The cookie options.
 */
function setCookie(ctx: Context, name: string, value: string, options: any): void {
  const cookies = ctx.cookies as any;
  const originalSecure = cookies.secure;
  try {
    if (options.secure) {
      cookies.secure = true;
    }
    ctx.cookies.set(name, value, options);
  } finally {
    cookies.secure = originalSecure;
  }
}

export function setAppRefreshTokenCookie(ctx: Context, appId: number, token: string): void {
  const path = `/apps/${appId}/auth/oauth2/token`;
  setCookie(ctx, APP_REFRESH_TOKEN_COOKIE_NAME, token, {
    ...getCookieOptions(path),
  });
}

function clearCookie(ctx: Context, name: string, path: string): void {
  const options = {
    expires: new Date(0),
    sameSite: 'none',
    secure: true,
    signed: true,
    partitioned: true,
  };

  setCookie(ctx, name, '', {
    ...options,
    httpOnly: true,
    path,
  });
}

export function clearAppCookies(ctx: Context, appId: number): void {
  clearCookie(ctx, APP_REFRESH_TOKEN_COOKIE_NAME, `/apps/${appId}/auth/oauth2/token`);
}
