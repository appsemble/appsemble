import { throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { authenticator } from 'otplib';
import { literal, Op } from 'sequelize';
import { type Repository } from 'sequelize-typescript';

import { argv } from './argv.js';
import { decrypt } from './crypto.js';
import { createTotpPendingToken } from './totpPendingToken.js';
import { type App, type AppMember } from '../models/index.js';

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
 * @param app The app the app member is logging in to. Every caller has just loaded it, so it’s
 *   passed in rather than queried again.
 * @param appMember The app member whose first authentication factor has been verified.
 * @param options The options for creating the pending token.
 * @returns The TOTP challenge to hand to the client, or `null` if no second factor is needed.
 */
export function requireTotp(
  app: Pick<App, 'demoMode' | 'totp'>,
  appMember: Pick<AppMember, 'id' | 'totpEnabled'>,
  { aud, scope }: Options,
): TotpChallenge | null {
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
 * The counter is incremented by the database, so codes which are tried in parallel all count. The
 * lockout is decided in that same statement, so there is no window in which the attempts are spent
 * but no lock is set. A lockout which has passed resets the counter instead, so the first bad code
 * after a lockout doesn’t immediately trigger the next one.
 *
 * @param member The app member whose code was rejected.
 * @param now The time the code was rejected.
 */
async function registerFailedTotpAttempt(member: AppMember, now: number): Promise<void> {
  const AppMemberModel = member.constructor as Repository<AppMember>;
  // Timestamps this code generated itself, so they’re safe to interpolate.
  const lockHasPassed = `"totpLockedUntil" IS NOT NULL AND "totpLockedUntil" <= '${new Date(
    now,
  ).toISOString()}'`;
  const lockedUntil = `'${new Date(now + TOTP_LOCKOUT_MS).toISOString()}'`;

  await AppMemberModel.update(
    {
      totpFailedAttempts: literal(
        `CASE WHEN ${lockHasPassed} THEN 1 ELSE "totpFailedAttempts" + 1 END`,
      ),
      // The count the database settles on is what decides the lockout, not the one this request
      // read, so it has to be derived in the same statement as the increment.
      totpLockedUntil: literal(
        `CASE
           WHEN ${lockHasPassed} THEN NULL
           WHEN "totpFailedAttempts" + 1 >= ${MAX_TOTP_ATTEMPTS} THEN ${lockedUntil}
           ELSE "totpLockedUntil"
         END`,
      ),
    },
    { where: { id: member.id } },
  );
}

/**
 * Verify a TOTP code against an app member’s secret, consuming it in the process.
 *
 * A code is only accepted once. Codes for a counter which has already been used are rejected, even
 * though they are still within the verification window. Too many rejected codes lock the app member
 * out for a while. Accepting a code also consumes the pending token of the login it completes, if
 * there is one, and a pending token which has already been consumed rejects the code.
 *
 * @param ctx The Koa context used to throw the error response.
 * @param member The app member whose code to verify. Must have a TOTP secret.
 * @param token The TOTP code to verify.
 * @param invalidStatus The status to respond with if the code is rejected.
 * @param consumedJti The id of the pending TOTP token this verification spends, if any.
 */
export async function assertTotpToken(
  ctx: Context,
  member: AppMember,
  token: string,
  invalidStatus: 400 | 401,
  consumedJti?: string,
): Promise<void> {
  const now = Date.now();

  if (member.totpLockedUntil && member.totpLockedUntil.getTime() > now) {
    throwKoaError(ctx, 429, 'Too many failed TOTP attempts, please try again later');
  }

  const secret = decrypt(member.totpSecret!, argv.aesSecret);
  // Otplib derives the counter from its own clock. Pinning the epoch makes it the same clock the
  // counter below is derived from, so the two can’t land on either side of a step boundary.
  const delta = authenticator.clone({ epoch: now }).checkDelta(token, secret);
  // The counter the code was generated for. It only ever increases, so a counter which is not
  // greater than the last accepted one means the code is being replayed.
  const counter = delta == null ? null : Math.floor(now / 1000 / TOTP_STEP) + delta;

  if (counter != null) {
    const AppMemberModel = member.constructor as Repository<AppMember>;
    // Consuming the counter and the pending token is what rejects a replay, so both checks have to
    // be part of the update. Requests sent in parallel then race for the same counter or the same
    // pending token, and only one of them can win.
    const [accepted] = await AppMemberModel.update(
      {
        totpFailedAttempts: 0,
        totpLastCounter: counter,
        totpLockedUntil: null,
        ...(consumedJti == null
          ? {}
          : { totpConsumedJti: consumedJti, totpVerifiedAt: new Date(now) }),
      },
      {
        where: {
          id: member.id,
          [Op.and]: [
            { [Op.or]: [{ totpLastCounter: null }, { totpLastCounter: { [Op.lt]: counter } }] },
            ...(consumedJti == null
              ? []
              : [
                  {
                    [Op.or]: [
                      { totpConsumedJti: null },
                      { totpConsumedJti: { [Op.ne]: consumedJti } },
                    ],
                  },
                ]),
          ],
        },
      },
    );

    if (accepted) {
      return;
    }
  }

  await registerFailedTotpAttempt(member, now);
  throwKoaError(ctx, invalidStatus, 'Invalid TOTP token');
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
