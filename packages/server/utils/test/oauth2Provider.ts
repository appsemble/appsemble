import {
  createServer as createHttpServer,
  type IncomingMessage,
  type RequestListener,
} from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { type AddressInfo } from 'node:net';
import { text } from 'node:stream/consumers';

import { basicAuth } from '@appsemble/node-utils';
import jwt from 'jsonwebtoken';
import forge from 'node-forge';
import { onTestFinished } from 'vitest';

export const providerClientId = 'appsemble';
export const providerClientSecret = 'provider-secret';
export const providerCode = 'provider-code';
export const providerUser = {
  sub: 'provider-user',
  email: 'user@example.com',
  name: 'Provider User',
  groups: ['/Appsemble/Managers'],
};

export interface OAuth2Provider {
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
}

export interface OAuth2ProviderOptions {
  /**
   * Replace the discovery document.
   */
  discovery?: Record<string, unknown>;

  /**
   * Answer every token request with this status and body.
   */
  token?: [number, unknown];

  /**
   * Serve HTTPS with a self-signed certificate.
   */
  https?: boolean;

  /**
   * The loopback address to listen on, by default 127.0.0.1.
   */
  address?: string;
}

function createSelfSignedCertificate(): { cert: string; key: string } {
  const { privateKey, publicKey } = forge.pki.rsa.generateKeyPair(2048);
  const certificate = forge.pki.createCertificate();
  const attributes = [{ name: 'commonName', value: 'provider' }];
  certificate.publicKey = publicKey;
  certificate.validity.notBefore = new Date(Date.now() - 6e4);
  certificate.validity.notAfter = new Date(Date.now() + 6e4);
  certificate.setSubject(attributes);
  certificate.setIssuer(attributes);
  certificate.setExtensions([{ name: 'subjectAltName', altNames: [{ type: 7, ip: '127.0.0.1' }] }]);
  certificate.sign(privateKey, forge.md.sha256.create());
  return {
    cert: forge.pki.certificateToPem(certificate),
    key: forge.pki.privateKeyToPem(privateKey),
  };
}

async function answerTokenRequest(
  req: IncomingMessage,
  token: OAuth2ProviderOptions['token'],
): Promise<[number, unknown]> {
  if (token) {
    return token;
  }
  if (req.headers.authorization !== basicAuth(providerClientId, providerClientSecret)) {
    return [401, { error: 'invalid_client', error_description: 'Invalid client credentials' }];
  }
  const body = new URLSearchParams(await text(req));
  if (body.get('code') !== providerCode) {
    return [400, { error: 'invalid_grant', error_description: 'Code not valid' }];
  }
  return [
    200,
    {
      access_token: 'provider-access-token',
      id_token: jwt.sign({ sub: providerUser.sub, email: providerUser.email }, 'provider-key', {
        noTimestamp: true,
      }),
      token_type: 'bearer',
    },
  ];
}

/**
 * Serve an OAuth2 provider like Keycloak on a loopback address, which knows one client.
 *
 * The provider is closed when the current test finishes.
 *
 * @param options How the provider deviates from a working provider.
 * @returns The endpoint URLs of the provider.
 */
export async function serveOAuth2Provider(
  options: OAuth2ProviderOptions = {},
): Promise<OAuth2Provider> {
  const { address = '127.0.0.1' } = options;
  let base = '';
  const realm = '/realms/test';
  const endpoints = {
    authorizationUrl: `${realm}/protocol/openid-connect/auth`,
    tokenUrl: `${realm}/protocol/openid-connect/token`,
    userInfoUrl: `${realm}/protocol/openid-connect/userinfo`,
  };
  const listener: RequestListener = async (req, res) => {
    let answer: [number, unknown] = [404, { error: 'Not found' }];
    if (req.url?.startsWith(endpoints.authorizationUrl)) {
      answer = [200, 'Sign in'];
    } else if (req.url === endpoints.tokenUrl) {
      answer = await answerTokenRequest(req, options.token);
    } else if (req.url === endpoints.userInfoUrl) {
      answer =
        req.headers.authorization === 'Bearer provider-access-token'
          ? [200, providerUser]
          : [401, { error: 'invalid_token' }];
    } else if (req.url === `${realm}/.well-known/openid-configuration`) {
      answer = [
        200,
        options.discovery ?? {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          authorization_endpoint: `${base}${endpoints.authorizationUrl}`,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_endpoint: `${base}${endpoints.tokenUrl}`,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          userinfo_endpoint: `${base}${endpoints.userInfoUrl}`,
        },
      ];
    }
    res.writeHead(answer[0], { 'content-type': 'application/json' });
    res.end(JSON.stringify(answer[1]));
  };
  const server = options.https
    ? createHttpsServer(createSelfSignedCertificate(), listener)
    : createHttpServer(listener);
  onTestFinished(() => {
    server.close();
  });
  await new Promise<void>((resolve) => {
    server.listen(0, address, resolve);
  });
  base = `${options.https ? 'https' : 'http'}://${address}:${(server.address() as AddressInfo).port}`;
  return {
    authorizationUrl: `${base}${endpoints.authorizationUrl}`,
    tokenUrl: `${base}${endpoints.tokenUrl}`,
    userInfoUrl: `${base}${endpoints.userInfoUrl}`,
  };
}
