import { createHash, randomUUID } from 'node:crypto';

import jwt from 'jsonwebtoken';
import { type Context } from 'koa';
import { Op, type Transaction } from 'sequelize';

import { getAppDB } from '../models/index.js';
import { argv } from './argv.js';

const COOKIE_NAME = 'app_refresh_token';
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

interface SessionRecord {
  aud: string;
  scope?: string;
  sub: string;
}

interface CreateOptions {
  appId: number;
  aud: string;
  scope?: string;
  sub: string;
  transaction?: Transaction;
}

interface SessionOptions {
  token?: string;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateRefreshToken(record: SessionRecord): {
  expires: Date;
  token: string;
} {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + REFRESH_TOKEN_TTL_SECONDS;

  const token = jwt.sign(
    {
      aud: record.aud,
      exp,
      iat,
      iss: argv.host,
      rti: randomUUID(),
      scope: record.scope,
      sub: record.sub,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      token_use: 'refresh',
    },
    argv.secret,
  );

  return {
    expires: new Date(exp * 1000),
    token,
  };
}

function setRefreshTokenCookie(ctx: Context, appId: number, token: string): void {
  ctx.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
    path: `/apps/${appId}/auth/oauth2/token`,
    sameSite: 'lax',
    secure: ctx.secure,
  });
}

function clearRefreshTokenCookie(ctx: Context, appId: number): void {
  ctx.cookies.set(COOKIE_NAME, '', {
    expires: new Date(0),
    httpOnly: true,
    path: `/apps/${appId}/auth/oauth2/token`,
    sameSite: 'lax',
    secure: ctx.secure,
  });
}

function getRefreshTokenFromRequest(ctx: Context): string | null {
  const cookieToken = ctx.cookies.get(COOKIE_NAME);
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

export async function createAppMemberRefreshSession(
  ctx: Context,
  { appId, aud, scope, sub, transaction }: CreateOptions,
): Promise<string> {
  const { expires, token } = generateRefreshToken({ aud, scope, sub });
  const tokenHash = hashToken(token);

  const { AppMemberRefreshSession } = await getAppDB(appId);
  await AppMemberRefreshSession.create(
    {
      aud,
      expires,
      scope,
      sub,
      tokenHash,
    },
    { transaction },
  );

  setRefreshTokenCookie(ctx, appId, token);

  return token;
}

export async function rotateAppMemberRefreshSession(
  ctx: Context,
  appId: number,
  { token: providedToken }: SessionOptions = {},
): Promise<SessionRecord & { refreshToken: string }> {
  const token = providedToken || getRefreshTokenFromRequest(ctx);
  if (!token) {
    throw new Error('Missing refresh token');
  }

  const currentTokenHash = hashToken(token);

  const { AppMemberRefreshSession } = await getAppDB(appId);
  const session = await AppMemberRefreshSession.findOne({
    attributes: ['id', 'aud', 'scope', 'sub'],
    where: {
      aud: `app:${appId}`,
      expires: {
        [Op.gt]: new Date(),
      },
      tokenHash: currentTokenHash,
    },
  });

  if (!session) {
    throw new Error('Invalid refresh token');
  }

  const record = session.toJSON() as SessionRecord;
  const { expires, token: nextToken } = generateRefreshToken(record);

  const [updatedRows] = await AppMemberRefreshSession.update(
    {
      expires,
      tokenHash: hashToken(nextToken),
    },
    {
      where: {
        id: session.id,
        tokenHash: currentTokenHash,
      },
    },
  );

  if (updatedRows !== 1) {
    throw new Error('Invalid refresh token');
  }

  setRefreshTokenCookie(ctx, appId, nextToken);

  return {
    ...record,
    refreshToken: nextToken,
  };
}

export async function revokeAppMemberRefreshSession(
  ctx: Context,
  appId: number,
  { token: providedToken }: SessionOptions = {},
): Promise<void> {
  const token = providedToken || getRefreshTokenFromRequest(ctx);
  if (!token) {
    clearRefreshTokenCookie(ctx, appId);
    return;
  }

  const { AppMemberRefreshSession } = await getAppDB(appId);
  await AppMemberRefreshSession.destroy({
    where: {
      aud: `app:${appId}`,
      tokenHash: hashToken(token),
    },
  });

  clearRefreshTokenCookie(ctx, appId);
}
