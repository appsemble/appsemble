import { type ServerActionParameters } from './index.js';

export function noop({ data }: ServerActionParameters): any {
  return data;
}
