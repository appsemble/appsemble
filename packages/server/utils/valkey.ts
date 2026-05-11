import { connect as netConnect, type Socket } from 'node:net';
import { connect as tlsConnect, type TLSSocket } from 'node:tls';

import { argv } from './argv.js';

type ValkeySocket = Socket | TLSSocket;

function createCommand(args: string[]): Buffer {
  const command = args.flatMap((arg) => [`$${Buffer.byteLength(arg)}\r\n`, `${arg}\r\n`]).join('');

  return Buffer.from(`*${args.length}\r\n${command}`);
}

function connectValkey(): Promise<ValkeySocket> {
  return new Promise((resolve, reject) => {
    const socket = argv.valkeyTls
      ? tlsConnect({ host: argv.valkeyHost, port: argv.valkeyPort })
      : netConnect({ host: argv.valkeyHost, port: argv.valkeyPort });
    const connectEvent = argv.valkeyTls ? 'secureConnect' : 'connect';
    let timer: ReturnType<typeof setTimeout>;
    let onConnect: () => void;
    let onError: (error: Error) => void;
    const cleanup = (): void => {
      clearTimeout(timer);
      socket.off(connectEvent, onConnect);
      socket.off('error', onError);
    };
    onConnect = (): void => {
      cleanup();
      resolve(socket);
    };
    onError = (error: Error): void => {
      cleanup();
      socket.destroy();
      reject(error);
    };

    timer = setTimeout(() => {
      cleanup();
      socket.destroy();
      reject(new Error('Valkey connection timed out'));
    }, 5000);
    socket.once(connectEvent, onConnect);
    socket.once('error', onError);
  });
}

async function sendValkeyCommand(socket: ValkeySocket, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout>;
    let onData: (chunk: Buffer) => void;
    let onError: (error: Error) => void;
    const cleanup = (): void => {
      clearTimeout(timer);
      socket.off('data', onData);
      socket.off('error', onError);
    };
    onData = (chunk: Buffer): void => {
      const response = String(chunk);
      const terminator = response.indexOf('\r\n');

      cleanup();
      if (terminator === -1) {
        reject(new Error('Valkey returned an incomplete response'));
      } else if (response.startsWith('-')) {
        reject(new Error(`Valkey replied with an error: ${response.slice(1, terminator)}`));
      } else if (response.startsWith('+')) {
        resolve();
      } else {
        reject(new Error('Valkey returned an unexpected response'));
      }
    };
    onError = (error: Error): void => {
      cleanup();
      reject(error);
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error('Valkey command timed out'));
    }, 5000);
    socket.once('data', onData);
    socket.once('error', onError);
    socket.write(createCommand(args));
  });
}

export async function pingValkey(): Promise<void> {
  if (!argv.valkeyHost) {
    return;
  }

  const socket = await connectValkey();

  try {
    if (argv.valkeyPassword) {
      await sendValkeyCommand(socket, ['AUTH', argv.valkeyUsername, argv.valkeyPassword]);
    }
    await sendValkeyCommand(socket, ['PING']);
  } finally {
    socket.destroy();
  }
}
