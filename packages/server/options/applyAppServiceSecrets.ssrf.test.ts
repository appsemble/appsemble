/**
 * These tests use real sockets, because axios-mock-adapter intercepts requests before the HTTP
 * agents that enforce SSRF protection are invoked.
 */
import { X509Certificate } from 'node:crypto';
import { createServer as createHttpServer, type Server as HttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import {
  type AddressInfo,
  createServer as createTcpServer,
  type Server as TcpServer,
} from 'node:net';
import { type TLSSocket } from 'node:tls';

import { request, setTestApp } from 'axios-test-instance';
import forge from 'node-forge';
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';

import { App, getAppDB, Organization } from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { encrypt } from '../utils/crypto.js';

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };
const actionUrl = 'http://127.0.0.1/action';

function listen(server: HttpServer | TcpServer, host: string): Promise<number> {
  onTestFinished(() => {
    server.close();
  });
  return new Promise((resolve) => {
    server.listen(0, host, () => resolve((server.address() as AddressInfo).port));
  });
}

function createSelfSignedCertificate(): { cert: string; key: string } {
  const { privateKey, publicKey } = forge.pki.rsa.generateKeyPair(2048);
  const certificate = forge.pki.createCertificate();
  const attributes = [{ name: 'commonName', value: 'token-endpoint' }];
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

async function triggerRequestAction(tokenUrl: string): Promise<string | null | undefined> {
  const { AppServiceSecret } = await getAppDB(1);
  await AppServiceSecret.create({
    name: 'Token service',
    urlPatterns: actionUrl,
    authenticationMethod: 'client-credentials',
    identifier: 'id',
    secret: encrypt('secret', argv.aesSecret),
    tokenUrl,
    public: true,
  });
  await request.get('/api/apps/1/actions/pages.0.blocks.0.actions.get?data={}');
  const secret = await AppServiceSecret.findOne({ where: { name: 'Token service' } });
  return secret?.lastTokenError;
}

describe('client credentials token request SSRF protection', () => {
  let connections: number;
  let target: TcpServer;

  beforeEach(async () => {
    vi.stubEnv('VITEST_CONF_ALLOW_PRIVATE_IP_PROXY', '');
    setArgv(argv);
    await setTestApp(await createServer({}));
    await Organization.create({ id: 'org' });
    await App.create({
      vapidPublicKey: '',
      vapidPrivateKey: '',
      OrganizationId: 'org',
      definition: {
        name: 'Test app',
        defaultPage: '',
        pages: [
          {
            name: '',
            blocks: [
              {
                type: '',
                version: '',
                actions: { get: { type: 'request', url: actionUrl } },
              },
            ],
          },
        ],
      },
    } as Partial<App>);
    connections = 0;
    target = createTcpServer((socket) => {
      connections += 1;
      socket.destroy();
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(['http://127.0.0.1', 'https://127.0.0.1', 'http://localhost'])(
    'should not connect to a token endpoint at %s',
    async (origin) => {
      const port = await listen(target, '127.0.0.1');

      const tokenError = await triggerRequestAction(`${origin}:${port}/token`);

      expect(tokenError).toMatch(/is not allowed/);
      expect(connections).toBe(0);
    },
  );

  it('should not follow a token endpoint redirect to a private address', async () => {
    const port = await listen(target, '127.0.0.1');
    let redirects = 0;
    const redirect = createHttpServer((req, res) => {
      redirects += 1;
      res.writeHead(307, { location: `http://127.0.0.1:${port}/token` });
      res.end();
    });
    const redirectPort = await listen(redirect, '127.0.0.2');
    vi.stubEnv('SSRF_ALLOW_IP_ADDRESS_LIST', '127.0.0.2');

    const tokenError = await triggerRequestAction(`http://127.0.0.2:${redirectPort}/token`);

    expect(tokenError).toMatch(/is not allowed/);
    expect(redirects).toBe(1);
    expect(connections).toBe(0);
  });

  it('should present the matching client certificate to the token endpoint', async () => {
    vi.stubEnv('SSRF_ALLOW_IP_ADDRESS_LIST', '127.0.0.1');
    const { cert, key } = createSelfSignedCertificate();
    let peerFingerprint: string | undefined;
    const tokenServer = createHttpsServer(
      { cert, key, requestCert: true, rejectUnauthorized: false },
      (req, res) => {
        peerFingerprint = (req.socket as TLSSocket).getPeerCertificate().fingerprint256;
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ access_token: 'token', expires_in: 3600 }));
      },
    );
    const port = await listen(tokenServer, '127.0.0.1');
    const tokenUrl = `https://127.0.0.1:${port}/token`;
    const { AppServiceSecret } = await getAppDB(1);
    await AppServiceSecret.create({
      name: 'Token endpoint certificate',
      urlPatterns: tokenUrl,
      authenticationMethod: 'client-certificate',
      identifier: cert,
      secret: encrypt(key, argv.aesSecret),
      ca: cert,
      public: true,
    });

    await triggerRequestAction(tokenUrl);

    expect(peerFingerprint).toBe(new X509Certificate(cert).fingerprint256);
  });
});
