import { ServerActionParameters } from '.';

export function throwAction({ data }: ServerActionParameters): any {
  throw data;
}
