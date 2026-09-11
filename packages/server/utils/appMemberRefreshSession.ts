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
  REFRESH_TOKEN_TTL_SECONDS,
  setAppRefreshTokenCookie,
} from './appCookies.js';

const ABSOLUTE_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const REFRESH_TOKEN_REPLAY_GRACE_MS = 30_000;

interface SessionRecord {
  aud: string;
  scope?: string;
  sub: string;
}

interface RefreshToken {
  expires: Date;
  iat: number;
  rti: string;
  token: string;
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

function getSessionRecord({ aud, scope, sub }: SessionRecord): SessionRecord {
  return normalizeSessionRecord({ aud, scope, sub });
}

function generateRefreshToken(
  record: SessionRecord,
  { iat = Math.floor(Date.now() / 1000), rti = randomUUID() }: { iat?: number; rti?: string } = {},
): RefreshToken {
  const exp = iat + REFRESH_TOKEN_TTL_SECONDS;

  const token = jwt.sign(
    {
      aud: record.aud,
      exp,
      iat,
      iss: argv.host,
      rti,
      scope: record.scope,
      sub: record.sub,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      token_use: 'refresh',
    },
    argv.secret,
  );

  return {
    expires: new Date(exp * 1000),
    iat,
    rti,
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

function reuseStoredRefreshToken(
  ctx: Context,
  appId: number,
  record: SessionRecord,
  tokenId?: string,
  tokenIssuedAt?: Date,
): SessionRecord & { refreshToken: string } {
  if (!tokenId || !tokenIssuedAt) {
    throw new Error('Invalid refresh token');
  }

  const refreshToken = generateRefreshToken(record, {
    iat: Math.floor(tokenIssuedAt.getTime() / 1000),
    rti: tokenId,
  }).token;

  setAppRefreshTokenCookie(ctx, appId, refreshToken);

  return {
    ...record,
    refreshToken,
  };
}

export async function createAppMemberRefreshSession(
  ctx: Context,
  { appId, aud, scope, sub, transaction }: CreateOptions,
): Promise<string> {
  const record = normalizeSessionRecord({ aud, scope, sub });
  const { expires, iat, rti, token } = generateRefreshToken(record);
  const tokenHash = hashToken(token);

  const { AppMemberRefreshSession } = await getAppDB(appId);
  await AppMemberRefreshSession.create(
    {
      aud: record.aud,
      expires,
      scope: record.scope,
      sub: record.sub,
      tokenHash,
      tokenId: rti,
      tokenIssuedAt: new Date(iat * 1000),
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
  const allowCookieReplayGrace = !providedToken;
  const token = providedToken || getRefreshTokenFromRequest(ctx);
  if (!token) {
    throw new Error('Missing refresh token');
  }

  const currentTokenHash = hashToken(token);
  const nowMs = Date.now();
  const now = new Date(nowMs);
  const replayExpires = new Date(nowMs + REFRESH_TOKEN_REPLAY_GRACE_MS);

  const { AppMemberRefreshSession } = await getAppDB(appId);
  const session = await AppMemberRefreshSession.findOne({
    attributes: ['id', 'aud', 'scope', 'sub', 'created', 'tokenHash', 'tokenId', 'tokenIssuedAt'],
    where: {
      aud: `app:${appId}`,
      expires: {
        [Op.gt]: now,
      },
      [Op.or]: allowCookieReplayGrace
        ? [
            { tokenHash: currentTokenHash },
            {
              previousTokenExpires: {
                [Op.gt]: now,
              },
              previousTokenHash: currentTokenHash,
            },
          ]
        : [{ tokenHash: currentTokenHash }],
    },
  });

  if (!session) {
    throw new Error('Invalid refresh token');
  }

  if (nowMs - session.created.getTime() > ABSOLUTE_SESSION_TTL_SECONDS * 1000) {
    throw new Error('Invalid refresh token');
  }

  const record = getSessionRecord(session);

  if (session.tokenHash !== currentTokenHash) {
    return reuseStoredRefreshToken(ctx, appId, record, session.tokenId, session.tokenIssuedAt);
  }

  const { expires, iat, rti, token: nextToken } = generateRefreshToken(record);

  const [updatedRows] = await AppMemberRefreshSession.update(
    {
      expires,
      previousTokenExpires: replayExpires,
      previousTokenHash: currentTokenHash,
      scope: record.scope,
      tokenHash: hashToken(nextToken),
      tokenId: rti,
      tokenIssuedAt: new Date(iat * 1000),
    },
    {
      where: {
        id: session.id,
        tokenHash: currentTokenHash,
      },
    },
  );

  if (updatedRows !== 1 && allowCookieReplayGrace) {
    const replaySession = await AppMemberRefreshSession.findOne({
      attributes: ['aud', 'scope', 'sub', 'tokenId', 'tokenIssuedAt'],
      where: {
        aud: `app:${appId}`,
        expires: {
          [Op.gt]: now,
        },
        id: session.id,
        previousTokenExpires: {
          [Op.gt]: now,
        },
        previousTokenHash: currentTokenHash,
      },
    });

    if (!replaySession) {
      throw new Error('Invalid refresh token');
    }

    const replayRecord = getSessionRecord(replaySession);
    return reuseStoredRefreshToken(
      ctx,
      appId,
      replayRecord,
      replaySession.tokenId,
      replaySession.tokenIssuedAt,
    );
  }

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
  const allowCookieReplayGrace = !providedToken;
  const token = providedToken || getRefreshTokenFromRequest(ctx);
  if (!token) {
    clearAppCookies(ctx, appId);
    return;
  }

  const { AppMemberRefreshSession } = await getAppDB(appId);
  const tokenHash = hashToken(token);
  const now = new Date();
  await AppMemberRefreshSession.destroy({
    where: {
      aud: `app:${appId}`,
      [Op.or]: allowCookieReplayGrace
        ? [
            { tokenHash },
            {
              previousTokenExpires: {
                [Op.gt]: now,
              },
              previousTokenHash: tokenHash,
            },
          ]
        : [{ tokenHash }],
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
