import pg from 'pg';
import { type Argv } from 'yargs';

const { DATABASE_HOST, DATABASE_NAME, DATABASE_PASSWORD, DATABASE_PORT, DATABASE_USER } =
  process.env;

export const command = 'seed-subscription';
export const description =
  'Update specified organizations subscription to the specified subscription, expiring in 1 month.';

export function builder(argv: Argv): Argv<any> {
  return argv
    .option('subscription', {
      type: 'string',
      required: true,
    })
    .option('organization', {
      type: 'string',
      required: true,
    });
}

interface Args {
  subscription: string;
  organization: string;
}

async function update(
  organization: string,
  subscription: string,
  client: pg.Client,
): Promise<void> {
  const expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const query =
    'UPDATE "OrganizationSubscription" SET "expirationDate"=$1, "subscriptionPlan"=$2, "cancelled"=false WHERE "OrganizationId"=$3';

  await client.query(query, [expirationDate, subscription, organization]);
}

export async function handler({ organization, subscription }: Args): Promise<void> {
  const client = new pg.Client({
    database: DATABASE_NAME,
    host: DATABASE_HOST,
    port: DATABASE_PORT ? Number(DATABASE_PORT) : undefined,
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
  });
  await client.connect();

  await update(organization, subscription, client);

  await client.end();
}
