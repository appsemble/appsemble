import { logger } from '@appsemble/node-utils';

import { getDB } from '../models/index.js';

/**
 * How long a database check result is reused. Every probe and monitor pointed at a replica shares
 * it, so each replica queries the database at most once per interval.
 */
const READY_CACHE_TTL = 10_000;

/**
 * How long the database check may take before it counts as down. Shorter than the readiness probe
 * timeout, so a hanging database reports `DOWN` instead of timing out the probe.
 */
const READY_QUERY_TIMEOUT = 2000;

export interface HealthCheck {
  name: string;
  status: 'DOWN' | 'UP';
  data?: Record<string, string>;
}

/**
 * A health response following the MicroProfile Health wire format.
 */
export interface HealthResponse {
  status: 'DOWN' | 'UP';
  checks: HealthCheck[];
}

let draining = false;
let cache: { checkedAt: number; check: HealthCheck } | undefined;
let pending: Promise<HealthCheck> | undefined;

/**
 * Mark this process as shutting down, so `/health/ready` reports `DOWN` and no new traffic is
 * routed to it.
 */
export function startDraining(): void {
  draining = true;
}

async function checkDatabase(): Promise<HealthCheck> {
  try {
    await getDB().authenticate({ retry: { max: 1, timeout: READY_QUERY_TIMEOUT } });
    return { name: 'database', status: 'UP', data: { detail: 'ok' } };
  } catch (error: unknown) {
    logger.warn(`Database readiness check failed: ${error}`);
    // Only the error class is reported, to keep hostnames out of an unauthenticated response.
    return { name: 'database', status: 'DOWN', data: { detail: (error as Error).name } };
  }
}

function getDatabaseCheck(): Promise<HealthCheck> {
  if (cache && Date.now() - cache.checkedAt < READY_CACHE_TTL) {
    return Promise.resolve(cache.check);
  }
  // Single-flight: concurrent probes wait for the query in progress rather than each opening
  // their own, which matters most when the database is already struggling.
  pending ??= checkDatabase().then((check) => {
    cache = { checkedAt: Date.now(), check };
    pending = undefined;
    return check;
  });
  return pending;
}

/**
 * Report whether this instance should receive traffic.
 *
 * Only hard dependencies take part. Valkey is a soft dependency: the app serving cache and the
 * rate limiter skip it when it is unavailable.
 *
 * @returns The readiness of this instance.
 */
export async function getReadiness(): Promise<HealthResponse> {
  if (draining) {
    return { status: 'DOWN', checks: [{ name: 'draining', status: 'DOWN' }] };
  }
  const check = await getDatabaseCheck();
  return { status: check.status, checks: [check] };
}
