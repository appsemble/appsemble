import { type SubscriptionPlanType } from '@appsemble/types';
import { Client, type Client as ClientType } from 'pg';

const {
  DATABASE_HOST = 'localhost',
  DATABASE_NAME = 'appsemble',
  DATABASE_PASSWORD = 'password',
  DATABASE_PORT = 5432,
  DATABASE_USER = 'admin',
} = process.env;

async function update(
  organizationId: string,
  subscriptionPlan: SubscriptionPlanType,
  client: ClientType,
): Promise<void> {
  const expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const query =
    'UPDATE "OrganizationSubscription" SET "expirationDate"=$1, "subscriptionPlan"=$2, "cancelled"=false WHERE "OrganizationId"=$3';

  await client.query(query, [expirationDate, subscriptionPlan, organizationId]);
}

/**
 * Updates the organization's subscription to the given plan
 *
 * @param organizationId ID of the organization to assign the subscription to
 * @param subscriptionPlan Type of subscription plan
 */
export async function updateSubscription(
  organizationId: string,
  subscriptionPlan: SubscriptionPlanType,
): Promise<void> {
  if (!DATABASE_HOST || !DATABASE_NAME || !DATABASE_PASSWORD || !DATABASE_PORT || !DATABASE_USER) {
    throw new Error('Missing database credentials');
  }

  const client = new Client({
    database: DATABASE_NAME,
    host: DATABASE_HOST,
    port: DATABASE_PORT ? Number(DATABASE_PORT) : undefined,
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
  });
  await client.connect();

  await update(organizationId, subscriptionPlan, client);

  await client.end();
}
