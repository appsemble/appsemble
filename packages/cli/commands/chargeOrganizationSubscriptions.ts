import { serverImport } from '../lib/serverImport.js';
import { type BaseArguments } from '../types.js';

export const command = 'charge-organization-subscriptions';
export const description =
  'Charges organization subscriptions 2 weeks in advance, retries failed payments and send an email notification for upcoming charges.';

export async function handler(argv: BaseArguments): Promise<void> {
  const { chargeOrganizationSubscriptions, setArgv } = await serverImport(
    'setArgv',
    'chargeOrganizationSubscriptions',
  );
  setArgv(argv);
  return chargeOrganizationSubscriptions();
}
