import { Middleware } from 'koa';
import { Logger } from 'winston';
import { Argv } from 'yargs';

export const logger: Logger;

export function setLogLevel(level: number): void;

export function configureLogger(): void;

export function handleError(msg: string, err: Error, yargs: Argv): void;

export function loggerMiddleware(): Middleware;

export class AppsembleError extends Error {
  constructor(message: string);
}
