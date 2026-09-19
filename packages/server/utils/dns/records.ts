import { setTimeout as sleep } from 'node:timers/promises';
import { inspect } from 'node:util';

import { AppsembleError, logger } from '@appsemble/node-utils';
import axios from 'axios';

import { argv } from '../argv.js';

/**
 * The time to live in seconds of the DNS records for organization host names.
 */
const recordTTL = 3600;

/**
 * The number of resource record sets to send in one bulk request.
 *
 * A bulk request is applied atomically, so the chunk size bounds both the size of a request and the
 * amount of work a retry repeats.
 */
const bulkSize = 250;

/**
 * The number of times a request is repeated after the deSEC API rate limit is reached.
 */
const maxRetries = 5;

/**
 * The record types which point a host name at the deployment.
 */
const recordTypes = ['A', 'AAAA'] as const;

/**
 * A set of DNS records which share a name and a type.
 */
interface RRset {
  /**
   * The name of the resource record set relative to the zone.
   */
  subname: string;

  /**
   * The type of the resource record set.
   */
  type: (typeof recordTypes)[number];

  /**
   * The time to live of the resource record set in seconds.
   */
  ttl: number;

  /**
   * The values of the resource record set. An empty array deletes the resource record set.
   */
  records: string[];
}

/**
 * The DNS provider which serves the zone of the deployment.
 */
interface Provider {
  /**
   * The token used to authenticate with the API of the provider.
   */
  token: string;

  /**
   * The IP addresses the host names resolve to, grouped by record type.
   */
  targets: Record<RRset['type'], string[]>;

  /**
   * The name of the zone which contains the host names.
   */
  zone: string;
}

/**
 * Get the DNS provider from the command line arguments and the environment.
 *
 * @returns The DNS provider, or undefined if Appsemble doesn't manage DNS records.
 */
function getProvider(): Provider | undefined {
  const { dnsProvider, dnsTargets, dnsToken, dnsZone } = argv;
  if (!dnsProvider) {
    return;
  }
  if (dnsProvider !== 'desec') {
    throw new AppsembleError(`Unknown DNS provider: ${inspect(dnsProvider)}`);
  }
  if (!dnsTargets || !dnsToken || !dnsZone) {
    throw new AppsembleError(
      'The DNS provider requires --dns-targets, --dns-token, and --dns-zone',
    );
  }
  const targets = dnsTargets
    .split(',')
    .map((target) => target.trim())
    .filter(Boolean);
  return {
    token: dnsToken,
    targets: {
      A: targets.filter((target) => !target.includes(':')),
      AAAA: targets.filter((target) => target.includes(':')),
    },
    zone: dnsZone,
  };
}

/**
 * Get the name of a host relative to the zone which contains it.
 *
 * @param host The host name to get the name of.
 * @param zone The name of the zone.
 * @returns The name of the host relative to the zone. The name of the zone itself is empty.
 */
function getSubname(host: string, zone: string): string {
  if (host === zone) {
    return '';
  }
  if (!host.endsWith(`.${zone}`)) {
    throw new AppsembleError(`Host name ${host} is not part of DNS zone ${zone}`);
  }
  return host.slice(0, -zone.length - 1);
}

/**
 * Write resource record sets to the deSEC API.
 *
 * A bulk request creates the resource record sets which don't exist yet, and replaces the ones
 * which do. The resource record sets are sent in chunks which fit the request size limit of the
 * API.
 *
 * @param rrsets The resource record sets to write.
 * @param provider The DNS provider to write the resource record sets to.
 */
async function writeRRsets(rrsets: RRset[], { token, zone }: Provider): Promise<void> {
  for (let index = 0; index < rrsets.length; index += bulkSize) {
    const chunk = rrsets.slice(index, index + bulkSize);
    for (let retries = 0; ; retries += 1) {
      try {
        await axios.patch(
          // Not SSRF: the zone is from server config (argv)
          // nosemgrep: nodejs_scan.javascript-ssrf-rule-node_ssrf
          `https://desec.io/api/v1/domains/${zone}/rrsets/`,
          chunk,
          { headers: { authorization: `Token ${token}` } },
        );
        break;
      } catch (error) {
        if (retries >= maxRetries || !axios.isAxiosError(error) || error.response?.status !== 429) {
          throw error;
        }
        const seconds = Number(error.response.headers['retry-after']);
        const retryAfter = Number.isFinite(seconds) ? seconds : 1;
        logger.warn(`Rate limited by the deSEC API. Retrying in ${retryAfter} seconds`);
        await sleep(retryAfter * 1000);
      }
    }
  }
}

/**
 * Point the given host names at the deployment.
 *
 * @param hosts The host names to create DNS records for.
 */
export async function createDNSRecords(hosts: string[]): Promise<void> {
  const provider = getProvider();
  if (!provider) {
    return;
  }
  const { targets, zone } = provider;
  const rrsets = hosts.flatMap((host) =>
    recordTypes
      .filter((type) => targets[type].length)
      .map((type) => ({
        subname: getSubname(host, zone),
        type,
        ttl: recordTTL,
        records: targets[type],
      })),
  );
  logger.info(`Creating ${rrsets.length} DNS records in zone ${zone}`);
  await writeRRsets(rrsets, provider);
  logger.info(`Successfully created ${rrsets.length} DNS records in zone ${zone}`);
}

/**
 * Remove the DNS records of the given host names.
 *
 * @param hosts The host names to delete DNS records for.
 */
export async function deleteDNSRecords(hosts: string[]): Promise<void> {
  const provider = getProvider();
  if (!provider) {
    return;
  }
  const { zone } = provider;
  const rrsets = hosts.flatMap((host) =>
    recordTypes.map((type) => ({
      subname: getSubname(host, zone),
      type,
      ttl: recordTTL,
      records: [],
    })),
  );
  logger.info(`Deleting ${rrsets.length} DNS records in zone ${zone}`);
  await writeRRsets(rrsets, provider);
  logger.info(`Successfully deleted ${rrsets.length} DNS records in zone ${zone}`);
}
