import { ServerActionParameters } from '.';

export function noop({ data }: ServerActionParameters): any {
  return data;
}
