import { throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { authenticator } from 'otplib';

import { argv } from './argv.js';
import { decrypt } from './crypto.js';
import { createTotpPendingToken } from './totpPendingToken.js';
import { App, type AppMember } from '../models/index.js';

/**
 * The time step of a TOTP code in seconds, and how many steps in either direction are accepted.
 *
 * These are set explicitly, because they are needed to derive the counter a code was generated for,
 * which is what makes rejecting replayed codes possible.
 */
const TOTP_STEP = 30;
const TOTP_WINDOW = 1;

authenticator.options = { window: TOTP_WINDOW, step: TOTP_STEP };

/**
 * How many consecutive bad TOTP codes are accepted before the app member is locked out.
 */
const MAX_TOTP_ATTEMPTS = 5;

/**
 * How long an app member is locked out after too many bad TOTP codes, in milliseconds.
 */
const TOTP_LOCKOUT_MS = 15 * 60 * 1000;

interface Options {
  /**
   * The audience to issue the pending token for, i.e. the OAuth2 client id of the app.
   */
  aud: string;

  /**
   * The scope to grant once the second factor has been verified.
   */
  scope?: string;
}

export interface TotpChallenge {
  /**
   * Whether the app member has already enrolled in TOTP.
   *
   * If not, they have to enroll before they can log in, which is only ever the case on apps where
   * TOTP is required.
   */
  totpEnabled: boolean;

  /**
   * The pending token proving the first authentication factor has been verified.
   */
  totpToken: string;
}

/**
 * Determine whether an app member has to verify a second factor before being issued tokens.
 *
 * This must be called by every flow which issues app member tokens based on credentials, after
 * those credentials have been verified and before any token is issued.
 *
 * @param appId The id of the app the app member is logging in to.
 * @param appMember The app member whose first authentication factor has been verified.
 * @param options The options for creating the pending token.
 * @returns The TOTP challenge to hand to the client, or `null` if no second factor is needed.
 */
export async function requireTotp(
  appId: number,
  appMember: Pick<AppMember, 'id' | 'totpEnabled'>,
  { aud, scope }: Options,
): Promise<TotpChallenge | null> {
  const app = await App.findByPk(appId, { attributes: ['demoMode', 'totp'] });

  // Fail closed. Callers are expected to have asserted the app exists.
  if (!app) {
    throw new Error(`App ${appId} not found`);
  }

  // Demo apps cannot enroll in TOTP at all, so requiring it would lock everyone out.
  if (app.demoMode || app.totp === 'disabled') {
    return null;
  }

  const totpEnabled = appMember.totpEnabled ?? false;

  // On apps where TOTP is merely enabled, only app members who opted in are challenged.
  if (app.totp === 'enabled' && !totpEnabled) {
    return null;
  }

  return {
    totpEnabled,
    totpToken: createTotpPendingToken({ aud, scope, sub: appMember.id }),
  };
}

/**
 * Register a rejected TOTP code, locking the app member out after too many of them.
 *
 * @param member The app member whose code was rejected.
 */
async function registerFailedTotpAttempt(member: AppMember): Promise<void> {
  const totpFailedAttempts = (member.totpFailedAttempts ?? 0) + 1;
  await member.update({
    totpFailedAttempts,
    totpLockedUntil:
      totpFailedAttempts >= MAX_TOTP_ATTEMPTS
        ? new Date(Date.now() + TOTP_LOCKOUT_MS)
        : (member.totpLockedUntil ?? null),
  });
}

/**
 * Verify a TOTP code against an app member’s secret, consuming it in the process.
 *
 * A code is only accepted once. Codes for a counter which has already been used are rejected, even
 * though they are still within the verification window. Too many rejected codes lock the app member
 * out for a while.
 *
 * @param ctx The Koa context used to throw the error response.
 * @param member The app member whose code to verify. Must have a TOTP secret.
 * @param token The TOTP code to verify.
 * @param invalidStatus The status to respond with if the code is rejected.
 */
export async function assertTotpToken(
  ctx: Context,
  member: AppMember,
  token: string,
  invalidStatus: 400 | 401,
): Promise<void> {
  const now = Date.now();

  if (member.totpLockedUntil && member.totpLockedUntil.getTime() > now) {
    throwKoaError(ctx, 429, 'Too many failed TOTP attempts, please try again later');
  }

  const secret = decrypt(member.totpSecret!, argv.aesSecret);
  const delta = authenticator.checkDelta(token, secret);
  // The counter the code was generated for. It only ever increases, so a counter which is not
  // greater than the last accepted one means the code is being replayed.
  const counter = delta == null ? null : Math.floor(now / 1000 / TOTP_STEP) + delta;

  if (counter == null || (member.totpLastCounter != null && counter <= member.totpLastCounter)) {
    await registerFailedTotpAttempt(member);
    throwKoaError(ctx, invalidStatus, 'Invalid TOTP token');
  }

  await member.update({
    totpFailedAttempts: 0,
    totpLastCounter: counter,
    totpLockedUntil: null,
  });
}

/**
 * Reject a request which may not be completed until a second factor has been verified.
 *
 * @param ctx The Koa context used to throw the error response.
 * @param challenge The TOTP challenge to hand to the client.
 */
export function throwTotpRequired(ctx: Context, challenge: TotpChallenge): never {
  throwKoaError(ctx, 401, 'TOTP verification required', {
    totpRequired: true,
    totpEnabled: challenge.totpEnabled,
    totpToken: challenge.totpToken,
  });
}
