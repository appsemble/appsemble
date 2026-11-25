import { getValkeyClient } from '../valkey.js';
import { type Context } from 'koa';
import { assertKoaCondition, logger } from '@appsemble/node-utils';

interface SlidingWindowRateLimitOptions {
  /**
   * A function that takes the Koa context and returns a string identifier for rate limiting (e.g., IP address, user ID).
   * If not provided, it defaults to using the client's IP address.
   * Could be a closure that uses information from the calling function's scope, such as an already extracted user ID or other relevant data.
   */
  readonly identifierFunction?: (ctx: Context) => string;

  /**
   * A custom error message to be returned when the rate limit is exceeded.
   *
   * @default 'Too many requests, please try again later.'
   */
  readonly errorMessage?: string;
}

const RATE_LIMIT_KEY_PREFIX = 'appsemble-rate-limit';

const script = `
local key = KEYS[1]
local window_ms = tonumber(ARGV[1])
local max_requests = tonumber(ARGV[2])

local current_time = redis.call('TIME')
-- Convert seconds and microseconds to milliseconds
local current_time_ms = (tonumber(current_time[1]) * 1000) + math.floor(tonumber(current_time[2]) / 1000)
local trim_time = current_time_ms - window_ms

redis.call('ZREMRANGEBYSCORE', key, 0, trim_time)
local request_count = redis.call('ZCARD', key)

if request_count < max_requests then
  -- Use milliseconds as the score. Concatenate seconds + micro to keep set member unique.
  redis.call('ZADD', key, current_time_ms, current_time[1] .. current_time[2])
  -- Convert milliseconds to seconds (rounding up) for the key expiration
  local expire_seconds = math.ceil(window_ms / 1000)
  redis.call('EXPIRE', key, expire_seconds)
  return 0
end
return 1
`;

function getRateLimitKey(
  ctx: Context,
  key: string,
  { identifierFunction = (context) => context.ip }: SlidingWindowRateLimitOptions,
): string {
  return `${RATE_LIMIT_KEY_PREFIX}:${key}:${identifierFunction(ctx)}`;
}

/**
 * Implements a sliding window rate limiter using Redis sorted sets.
 * Each request is recorded with a timestamp, and old requests are removed based on the specified window.
 * The check is skipped while the Valkey client is not connected, so an outage never blocks the request.
 *
 * @param ctx Koa context object, used to extract the identifier (e.g., IP address).
 * @param key A unique key to identify the rate limit (e.g., 'login', 'register').
 * @param maxRequests The maximum number of allowed requests within the specified window.
 * @param windowMs The time window in milliseconds for which the rate limit applies.
 * @param options Optional configuration for the rate limiter, including a custom identifier function.
 * @returns Whether the number of requests in the current window exceeds the maximum allowed.
 */
export async function isSlidingWindowRateLimited(
  ctx: Context,
  key: string,
  maxRequests: number,
  windowMs: number,
  options: SlidingWindowRateLimitOptions = {},
): Promise<boolean> {
  const client = getValkeyClient();
  if (client?.status !== 'ready') {
    logger.warn(
      `Valkey client ${client ? client.status : 'not initialized'}, skipping rate limit check`,
    );
    return false;
  }
  const response = await client.eval(
    script,
    1,
    getRateLimitKey(ctx, key, options),
    String(windowMs),
    String(maxRequests),
  );
  return Number(response) === 1;
}

/**
 * Asserts a 429 error if the client exceeds the sliding window rate limit.
 *
 * @param ctx Koa context object, used to extract the identifier (e.g., IP address) and to assert conditions.
 * @param key A unique key to identify the rate limit (e.g., 'login', 'register').
 * @param maxRequests The maximum number of allowed requests within the specified window.
 * @param windowMs The time window in milliseconds for which the rate limit applies.
 * @param options Optional configuration for the rate limiter, including a custom identifier function and error message.
 */
export async function assertSlidingWindowRateLimit(
  ctx: Context,
  key: string,
  maxRequests: number,
  windowMs: number,
  options: SlidingWindowRateLimitOptions = {},
): Promise<void> {
  assertKoaCondition(
    !(await isSlidingWindowRateLimited(ctx, key, maxRequests, windowMs, options)),
    ctx,
    429,
    options.errorMessage ?? 'Too many requests, please try again later.',
  );
}

/**
 * Forget the requests recorded by {@link isSlidingWindowRateLimited} for the client.
 *
 * @param ctx Koa context object, used to extract the identifier (e.g., IP address).
 * @param key The key that was passed to {@link isSlidingWindowRateLimited}.
 * @param options The options that were passed to {@link isSlidingWindowRateLimited}.
 */
export async function resetSlidingWindowRateLimit(
  ctx: Context,
  key: string,
  options: SlidingWindowRateLimitOptions = {},
): Promise<void> {
  const client = getValkeyClient();
  if (client?.status === 'ready') {
    await client.del(getRateLimitKey(ctx, key, options));
  }
}
