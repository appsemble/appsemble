import { type Connection } from 'vscode-languageserver';

export interface Logger {
  debug: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  log: (message: string) => void;
}

export class ConnectionLogger implements Logger {
  private connection: Connection;

  constructor(connection: import('vscode-languageserver').Connection) {
    this.connection = connection;
  }

  debug(message: string): void {
    this.connection.console.debug(message);
  }

  info(message: string): void {
    this.connection.console.info(message);
  }

  warn(message: string): void {
    this.connection.console.warn(message);
  }

  error(message: string): void {
    this.connection.console.error(message);
  }

  log(message: string): void {
    this.connection.console.log(message);
  }
}

interface ConnectionLoggerFactoryOptions {
  connection: Connection;
  // Map log levels to another log level
  levelMappings?: {
    debug?: 'debug' | 'error' | 'info' | 'log' | 'warn';
    info?: 'debug' | 'error' | 'info' | 'log' | 'warn';
    warn?: 'debug' | 'error' | 'info' | 'log' | 'warn';
    error?: 'debug' | 'error' | 'info' | 'log' | 'warn';
    log?: 'debug' | 'error' | 'info' | 'log' | 'warn';
  };
}

export function connectionLoggerFactory({
  connection,
  levelMappings,
}: ConnectionLoggerFactoryOptions): Logger {
  return new (class implements Logger {
    #connection = connection;

    debug(message: string): void {
      this.#connection.console[levelMappings?.debug ?? 'debug'](message);
    }

    info(message: string): void {
      this.#connection.console[levelMappings?.info ?? 'info'](message);
    }

    warn(message: string): void {
      this.#connection.console[levelMappings?.warn ?? 'warn'](message);
    }

    error(message: string): void {
      this.#connection.console[levelMappings?.error ?? 'error'](message);
    }

    log(message: string): void {
      this.#connection.console[levelMappings?.log ?? 'log'](message);
    }
  })();
}
