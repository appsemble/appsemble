import dns from 'node:dns';
import { isIP } from 'node:net';

import ipaddr from 'ipaddr.js';
import { RequestFilteringHttpAgent, RequestFilteringHttpsAgent } from 'request-filtering-agent';

export interface SSRFOptions {
  allowPrivateIPAddress?: boolean;
  hostname?: string;
  httpAgent?: any;
  httpsAgent?: any;
}

/**
 * Detect NAT64 (RFC 6052 well-known prefix) and IPv4-mapped IPv6 addresses whose embedded IPv4 is a
 * public unicast address.
 *
 * `request-filtering-agent` blocks these IPv6 forms, so when they wrap a legitimate public address
 * we return it to be added to the allow-list. Addresses embedding a private/loopback/link-local
 * IPv4 (e.g. `64:ff9b::127.0.0.1`) return `undefined` and stay blocked.
 *
 * @param address An IP address string (not a hostname).
 * @returns The address when it should be allow-listed, otherwise `undefined`.
 */
function getAllowableEmbeddedAddress(address: string): string | undefined {
  let parsed: ReturnType<typeof ipaddr.parse>;
  try {
    parsed = ipaddr.parse(address);
  } catch {
    return undefined;
  }

  if (parsed.kind() !== 'ipv6') {
    return undefined;
  }

  const ipv6 = parsed as ipaddr.IPv6;
  const range = ipv6.range();
  let ipv4: ipaddr.IPv4 | undefined;

  if (range === 'rfc6052') {
    const parts = ipv6.toByteArray();
    // For the well-known prefix /96, the IPv4 is in parts[12...15]
    if (parts[0] === 0x00 && parts[1] === 0x64 && parts[2] === 0xff && parts[3] === 0x9b) {
      ipv4 = new ipaddr.IPv4(parts.slice(12));
    }
  } else if (range === 'ipv4Mapped') {
    ipv4 = ipv6.toIPv4Address();
  }

  return ipv4 && ipv4.range() === 'unicast' ? address : undefined;
}

export async function getSSRFProtectedAgents(options: SSRFOptions = {}): Promise<{
  httpAgent: RequestFilteringHttpAgent;
  httpsAgent: RequestFilteringHttpsAgent;
}> {
  const {
    allowPrivateIPAddress = process.env.VITEST_CONF_ALLOW_PRIVATE_IP_PROXY === '1',
    hostname,
  } = options;

  const allowIPAddressList = process.env.SSRF_ALLOW_IP_ADDRESS_LIST?.split(',') ?? [];

  // `URL.hostname` wraps IPv6 literals in brackets (e.g. `[64:ff9b::1]`); strip them so the value
  // can be parsed as an IP and resolved by DNS.
  const normalizedHostname = hostname?.replace(/^\[|]$/g, '');

  if (normalizedHostname) {
    if (isIP(normalizedHostname)) {
      // IP literal: inspect it directly. No DNS lookup is needed (which also avoids resolving on top
      // of the lookup request-filtering-agent already performs at connect time).
      const allowable = getAllowableEmbeddedAddress(normalizedHostname);
      if (allowable) {
        allowIPAddressList.push(allowable);
      }
    } else {
      // Real hostname: resolve to detect NAT64/DNS64-synthesised addresses.
      try {
        const addresses = await dns.promises.lookup(normalizedHostname, { all: true });
        for (const { address } of addresses) {
          const allowable = getAllowableEmbeddedAddress(address);
          if (allowable) {
            allowIPAddressList.push(allowable);
          }
        }
      } catch {
        // Ignore DNS lookup errors, the agent will handle them
      }
    }
  }

  const existingHttpOptions = options.httpAgent?.options ?? {};
  const existingHttpsOptions = options.httpsAgent?.options ?? {};

  return {
    httpAgent: new RequestFilteringHttpAgent({
      ...existingHttpOptions,
      allowPrivateIPAddress,
      allowIPAddressList,
    }),
    httpsAgent: new RequestFilteringHttpsAgent({
      ...existingHttpsOptions,
      allowPrivateIPAddress,
      allowIPAddressList,
    }),
  };
}
