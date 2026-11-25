import dns from 'node:dns';
import { type AgentOptions, Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent, type AgentOptions as HttpsAgentOptions } from 'node:https';
import { isIP } from 'node:net';
import { type Duplex } from 'node:stream';

import ipaddr from 'ipaddr.js';
import {
  RequestFilteringHttpAgent,
  type RequestFilteringAgentOptions,
  RequestFilteringHttpsAgent,
} from 'request-filtering-agent';

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

/**
 * An HTTP agent that connects to the allowed host names whatever address they resolve to, and to
 * any other host only when `request-filtering-agent` accepts its address.
 *
 * The agent creates a connection for each host, so every redirect hop is checked against its own
 * host and a listed host cannot redirect a request to an unlisted private address.
 */
class SSRFProtectedHttpAgent extends RequestFilteringHttpAgent {
  allowHostnames: Set<string>;

  constructor(allowHostnames: Set<string>, options: AgentOptions & RequestFilteringAgentOptions) {
    super(options);
    this.allowHostnames = allowHostnames;
  }

  override createConnection(
    ...args: Parameters<RequestFilteringHttpAgent['createConnection']>
  ): Duplex {
    return this.allowHostnames.has(args[0].host?.toLowerCase() ?? '')
      ? (HttpAgent.prototype.createConnection.apply(this, args) as Duplex)
      : super.createConnection(...args);
  }
}

/**
 * The HTTPS counterpart of {@link SSRFProtectedHttpAgent}.
 */
class SSRFProtectedHttpsAgent extends RequestFilteringHttpsAgent {
  allowHostnames: Set<string>;

  constructor(
    allowHostnames: Set<string>,
    options: HttpsAgentOptions & RequestFilteringAgentOptions,
  ) {
    super(options);
    this.allowHostnames = allowHostnames;
  }

  override createConnection(
    ...args: Parameters<RequestFilteringHttpsAgent['createConnection']>
  ): Duplex {
    return this.allowHostnames.has(args[0].host?.toLowerCase() ?? '')
      ? (HttpsAgent.prototype.createConnection.apply(this, args) as Duplex)
      : super.createConnection(...args);
  }
}

export async function getSSRFProtectedAgents(options: SSRFOptions = {}): Promise<{
  httpAgent: RequestFilteringHttpAgent;
  httpsAgent: RequestFilteringHttpsAgent;
}> {
  const {
    allowPrivateIPAddress = process.env.VITEST_CONF_ALLOW_PRIVATE_IP_PROXY === '1',
    hostname,
  } = options;

  const allowIPAddressList: string[] = [];
  const allowHostnames = new Set<string>();
  for (const entry of process.env.SSRF_ALLOW_IP_ADDRESS_LIST?.split(',') ?? []) {
    if (isIP(entry) || ipaddr.isValidCIDR(entry)) {
      allowIPAddressList.push(entry);
    } else {
      allowHostnames.add(entry.toLowerCase());
    }
  }

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
    httpAgent: new SSRFProtectedHttpAgent(allowHostnames, {
      ...existingHttpOptions,
      allowPrivateIPAddress,
      allowIPAddressList,
    }),
    httpsAgent: new SSRFProtectedHttpsAgent(allowHostnames, {
      ...existingHttpsOptions,
      allowPrivateIPAddress,
      allowIPAddressList,
    }),
  };
}
