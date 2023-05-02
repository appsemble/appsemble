import { type ServerActionParameters } from './index.js';

export function throwAction({ data }: ServerActionParameters): any {
  throw data;
}
