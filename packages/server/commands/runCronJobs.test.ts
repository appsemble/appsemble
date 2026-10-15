import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { type AddressInfo, createServer, type Server } from 'node:net';
import { fileURLToPath } from 'node:url';

import { getAppAssetLocation, uploadS3File } from '@appsemble/node-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { App, getAppDB, getDB, Organization } from '../models/index.js';

const require = createRequire(import.meta.url);
const tsxCli = require.resolve('tsx/cli');
const bin = fileURLToPath(new URL('../bin.ts', import.meta.url));

interface SmtpStub {
  port: number;
  messages: string[];
  close: () => Promise<void>;
}

/**
 * Listen for SMTP deliveries on a random local port.
 *
 * The stub speaks just enough SMTP for nodemailer to hand over a message and records the raw DATA
 * payload of every delivery.
 *
 * @returns The stub's port, the received messages and a function to stop listening.
 */
function startSmtpStub(): Promise<SmtpStub> {
  const messages: string[] = [];
  const server: Server = createServer((socket) => {
    let buffer = '';
    let receivingData = false;
    socket.on('error', () => null);
    socket.write('220 localhost ESMTP\r\n');
    socket.on('data', (chunk) => {
      buffer += String(chunk);
      if (receivingData) {
        const end = buffer.indexOf('\r\n.\r\n');
        if (end === -1) {
          return;
        }
        messages.push(buffer.slice(0, end));
        buffer = buffer.slice(end + 5);
        receivingData = false;
        socket.write('250 OK\r\n');
      }
      let newline = buffer.indexOf('\r\n');
      while (newline !== -1) {
        const command = buffer.slice(0, newline).split(' ')[0].toUpperCase();
        buffer = buffer.slice(newline + 2);
        if (command === 'EHLO') {
          socket.write('250-localhost\r\n250-AUTH PLAIN\r\n250 8BITMIME\r\n');
        } else if (command === 'AUTH') {
          socket.write('235 Authenticated\r\n');
        } else if (command === 'DATA') {
          receivingData = true;
          socket.write('354 Go ahead\r\n');
          break;
        } else if (command === 'QUIT') {
          socket.end('221 Bye\r\n');
        } else {
          socket.write('250 OK\r\n');
        }
        newline = buffer.indexOf('\r\n');
      }
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({
        port: (server.address() as AddressInfo).port,
        messages,
        close: () =>
          new Promise((done) => {
            server.close(() => done());
          }),
      });
    });
  });
}

/**
 * Run the `run-cronjobs` command against the test services.
 *
 * @param smtpPort The port of the SMTP stub the command delivers emails to.
 * @throws If the command exits with a non-zero exit code.
 */
async function runCronJobs(smtpPort: number): Promise<void> {
  const { database, host, password, port, username } = getDB().config;
  const child = spawn(process.execPath, [
    tsxCli,
    bin,
    'run-cronjobs',
    `--database-host=${host}`,
    `--database-port=${port}`,
    `--database-user=${username}`,
    `--database-password=${password}`,
    `--database-name=${database}`,
    `--s3-host=${process.env.S3_HOST || 'localhost'}`,
    `--s3-port=${process.env.S3_PORT || 9009}`,
    '--s3-secure=false',
    `--s3-access-key=${process.env.S3_ACCESS_KEY || 'admin'}`,
    `--s3-secret-key=${process.env.S3_SECRET_KEY || 'password'}`,
    ...(process.env.S3_BUCKET ? [`--s3-bucket=${process.env.S3_BUCKET}`] : []),
    '--host=http://localhost:9999',
    '--smtp-host=127.0.0.1',
    `--smtp-port=${smtpPort}`,
    '--smtp-secure=false',
    '--smtp-user=smtp-user',
    '--smtp-pass=smtp-pass',
    '--smtp-from=cron@example.com',
  ]);
  let output = '';
  child.stdout.on('data', (chunk) => {
    output += String(chunk);
  });
  child.stderr.on('data', (chunk) => {
    output += String(chunk);
  });
  const [code] = await once(child, 'close');
  if (code !== 0) {
    throw new Error(`run-cronjobs exited with code ${code}:\n${output}`);
  }
}

describe('run-cronjobs', () => {
  let smtp: SmtpStub;

  beforeEach(async () => {
    smtp = await startSmtpStub();
    await Organization.create({ id: 'testorg' });
  });

  afterEach(async () => {
    await smtp.close();
  });

  it('should attach app assets to emails sent by cron jobs', async () => {
    const app = await App.create({
      OrganizationId: 'testorg',
      path: 'cron-app',
      vapidPrivateKey: '',
      vapidPublicKey: '',
      definition: {
        name: 'Cron App',
        defaultPage: '',
        pages: [],
        cron: {
          nightly: {
            schedule: '* * * * *',
            action: {
              type: 'email',
              to: 'recipient@example.com',
              subject: 'Nightly export',
              body: 'The export is attached.',
              attachments: 'format-print',
            },
          },
        },
      },
    } as Partial<App>);
    const { Asset } = await getAppDB(app.id);
    const asset = await Asset.create({
      name: 'format-print',
      filename: 'format-print.docx',
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const content = Buffer.from('cron attachment');
    const { bucket, key } = getAppAssetLocation(app.id, asset.id);
    await uploadS3File(bucket, key, content);

    await runCronJobs(smtp.port);

    expect(smtp.messages).toHaveLength(1);
    expect(smtp.messages[0]).toContain('filename=format-print.docx');
    expect(smtp.messages[0]).toContain(content.toString('base64'));
  }, 60_000);
});
