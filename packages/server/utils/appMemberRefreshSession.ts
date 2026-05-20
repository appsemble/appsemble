import { createHash, randomUUID } from 'node:crypto';

import { appOAuth2Scope } from '@appsemble/utils';
import jwt from 'jsonwebtoken';
import { type Context } from 'koa';
import { Op, type Transaction } from 'sequelize';

import { getAppDB } from '../models/index.js';
import { argv } from './argv.js';
import {
  APP_REFRESH_TOKEN_COOKIE_NAME,
  clearAppCookies,
  setAppRefreshTokenCookie,
} from './appCookies.js';

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

function normalizeSessionRecord(record: SessionRecord): SessionRecord {
  if (record.scope || !record.aud.startsWith('app:')) {
    return record;
  }

  return {
    ...record,
    scope: appOAuth2Scope,
  };
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

function getRefreshTokenFromRequest(ctx: Context): string | null {
  const cookieToken = ctx.cookies.get(APP_REFRESH_TOKEN_COOKIE_NAME, { signed: true });
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

export async function createAppMemberRefreshSession(
  ctx: Context,
  { appId, aud, scope, sub, transaction }: CreateOptions,
): Promise<string> {
  const record = normalizeSessionRecord({ aud, scope, sub });
  const { expires, token } = generateRefreshToken(record);
  const tokenHash = hashToken(token);

  const { AppMemberRefreshSession } = await getAppDB(appId);
  await AppMemberRefreshSession.create(
    {
      aud: record.aud,
      expires,
      scope: record.scope,
      sub: record.sub,
      tokenHash,
    },
    { transaction },
  );

  setAppRefreshTokenCookie(ctx, appId, token);

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

  const record = normalizeSessionRecord(session.toJSON() as SessionRecord);
  const { expires, token: nextToken } = generateRefreshToken(record);

  const [updatedRows] = await AppMemberRefreshSession.update(
    {
      expires,
      scope: record.scope,
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

  setAppRefreshTokenCookie(ctx, appId, nextToken);

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
    clearAppCookies(ctx, appId);
    return;
  }

  const { AppMemberRefreshSession } = await getAppDB(appId);
  await AppMemberRefreshSession.destroy({
    where: {
      aud: `app:${appId}`,
      tokenHash: hashToken(token),
    },
  });

  clearAppCookies(ctx, appId);
}

export async function revokeAppMemberRefreshSessionsForMember(
  appId: number,
  sub: string,
): Promise<void> {
  const { AppMemberRefreshSession } = await getAppDB(appId);
  await AppMemberRefreshSession.destroy({
    where: {
      aud: `app:${appId}`,
      sub,
    },
  });
}
