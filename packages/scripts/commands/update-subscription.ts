import { updateSubscription } from '@appsemble/node-utils';
import { SubscriptionPlanType } from '@appsemble/types';
import { type Argv } from 'yargs';

export const command = 'update-subscription';
export const description =
  'Update specified organizations subscription to the specified subscription, expiring in 1 month.';

export function builder(argv: Argv): Argv<any> {
  return argv
    .option('subscriptionPlan', {
      type: 'string',
      required: true,
    })
    .option('organizationId', {
      type: 'string',
      required: true,
    });
}

interface Args {
  subscriptionPlan: string;
  organizationId: string;
}

function parsePlanEnum(input: string): SubscriptionPlanType {
  if (Object.values(SubscriptionPlanType).includes(input as SubscriptionPlanType)) {
    return input as SubscriptionPlanType;
  }
  throw new Error(`${input} is not a valid SubscriptionPlanType`);
}

export async function handler({ organizationId, subscriptionPlan }: Args): Promise<void> {
  const plan = parsePlanEnum(subscriptionPlan);
  await updateSubscription(organizationId, plan);
}
