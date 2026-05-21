import { Script } from '@valkey/valkey-glide';
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

const script = new Script(`
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
`);

/**
 * Implements a sliding window rate limiter using Redis sorted sets.
 * Each request is recorded with a timestamp, and old requests are removed based on the specified window.
 * If the number of requests in the current window exceeds the maximum allowed, the function will assert a 429 error.
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
  const client = getValkeyClient();
  if (!client) {
    logger.warn('Valkey client not initialized, skipping rate limit check');
    return;
  }
  const idFunction = options.identifierFunction ?? ((context) => context.ip);
  const identifier = idFunction(ctx);
  const fullKey = `${RATE_LIMIT_KEY_PREFIX}:${key}:${identifier}`;
  const response = await client?.invokeScript(script, {
    keys: [fullKey],
    args: [String(windowMs), String(maxRequests)],
  });
  const isRateLimited = response === 1;
  assertKoaCondition(
    !isRateLimited,
    ctx,
    429,
    options.errorMessage ?? 'Too many requests, please try again later.',
  );
}
