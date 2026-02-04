import { logger } from '@appsemble/node-utils';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { App, getAppDB, initDB, transactional } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { decrypt, encrypt } from '../utils/crypto.js';
import { handleDBError } from '../utils/sqlUtils.js';

interface AdditionalArguments {
  oldAesSecret?: string;
  batch?: number;
}

export const command = 'reencrypt-secrets';
export const description =
  'Re-encrypts all secrets in the database using the current AES secret. Use this when rotating from an old AES secret to a new one.';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs)
    .option('old-aes-secret', {
      desc: 'The old AES secret that was used to encrypt the secrets',
      type: 'string',
      demandOption: true,
    })
    .option('batch', {
      desc: 'The number of apps to process in each batch',
      type: 'number',
      default: 50,
    });
}

export async function handler({
  oldAesSecret,
  batch = 50,
}: AdditionalArguments = {}): Promise<void> {
  const { aesSecret: newAesSecret } = argv;

  if (!oldAesSecret) {
    logger.error('--old-aes-secret is required');
    process.exit(1);
  }

  if (!newAesSecret) {
    logger.error('--aes-secret is required');
    process.exit(1);
  }

  if (oldAesSecret === newAesSecret) {
    logger.error('Old and new AES secrets are the same. No re-encryption needed.');
    process.exit(1);
  }

  let db;

  try {
    db = initDB({
      host: argv.databaseHost,
      port: argv.databasePort,
      username: argv.databaseUser,
      password: argv.databasePassword,
      database: argv.databaseName,
      ssl: argv.databaseSsl,
      uri: argv.databaseUrl,
    });
  } catch (error: unknown) {
    handleDBError(error as Error);
  }

  logger.info('Starting re-encryption of secrets...');

  const totalApps = await App.count();
  logger.info(`Found ${totalApps} apps to process in batches of ${batch}`);

  for (let offset = 0; offset < totalApps; offset += batch) {
    const currentOffset = offset;
    logger.info(
      `Processing batch ${Math.floor(currentOffset / batch) + 1} (apps ${currentOffset + 1}-${Math.min(currentOffset + batch, totalApps)})`,
    );

    await transactional(async (transaction) => {
      const apps = await App.findAll({
        attributes: [
          'id',
          'dbHost',
          'dbPort',
          'dbUser',
          'dbPassword',
          'emailPassword',
          'scimToken',
          'stripeApiSecretKey',
          'stripeWebhookSecret',
        ],
        order: [['id', 'ASC']],
        limit: batch,
        offset: currentOffset,
        transaction,
      });

      for (const app of apps) {
        // Re-encrypt App model secrets
        const appUpdates: Partial<{
          dbPassword: Buffer;
          emailPassword: Buffer;
          scimToken: Buffer;
          stripeApiSecretKey: Buffer;
          stripeWebhookSecret: Buffer;
        }> = {};

        if (app.dbPassword) {
          logger.info(`Updating app ${app.id} dbPassword`);
          const decrypted = decrypt(app.dbPassword, oldAesSecret);
          appUpdates.dbPassword = encrypt(decrypted, newAesSecret);
        }

        if (app.emailPassword) {
          logger.info(`Updating app ${app.id} emailPassword`);
          const decrypted = decrypt(app.emailPassword, oldAesSecret);
          appUpdates.emailPassword = encrypt(decrypted, newAesSecret);
        }

        if (app.scimToken) {
          logger.info(`Updating app ${app.id} scimToken`);
          const decrypted = decrypt(app.scimToken, oldAesSecret);
          appUpdates.scimToken = encrypt(decrypted, newAesSecret);
        }

        if (app.stripeApiSecretKey) {
          logger.info(`Updating app ${app.id} stripeApiSecretKey`);
          const decrypted = decrypt(app.stripeApiSecretKey, oldAesSecret);
          appUpdates.stripeApiSecretKey = encrypt(decrypted, newAesSecret);
        }

        if (app.stripeWebhookSecret) {
          logger.info(`Updating app ${app.id} stripeWebhookSecret`);
          const decrypted = decrypt(app.stripeWebhookSecret, oldAesSecret);
          appUpdates.stripeWebhookSecret = encrypt(decrypted, newAesSecret);
        }

        if (Object.keys(appUpdates).length > 0) {
          await app.update(appUpdates, { transaction });
          logger.info(`Re-encrypted main database secrets for app ${app.id}`);
        }

        // Re-encrypt app database secrets
        const {
          AppServiceSecret,
          AppWebhookSecret,
          sequelize: appDB,
        } = await getAppDB(app.id, undefined, undefined, true, oldAesSecret);

        await appDB.transaction(async (appTransaction) => {
          // Re-encrypt AppServiceSecret
          const serviceSecrets = await AppServiceSecret.findAll({
            attributes: ['id', 'secret', 'accessToken'],
            transaction: appTransaction,
          });

          for (const secret of serviceSecrets) {
            const secretUpdates: Partial<{ secret: Buffer; accessToken: Buffer }> = {};

            if (secret.secret) {
              logger.info(`Updating app ${app.id} AppServiceSecret ${secret.id} secret`);
              const decrypted = decrypt(secret.secret, oldAesSecret);
              secretUpdates.secret = encrypt(decrypted, newAesSecret);
            }

            if (secret.accessToken) {
              logger.info(`Updating app ${app.id} AppServiceSecret ${secret.id} accessToken`);
              const decrypted = decrypt(secret.accessToken, oldAesSecret);
              secretUpdates.accessToken = encrypt(decrypted, newAesSecret);
            }

            if (Object.keys(secretUpdates).length > 0) {
              await secret.update(secretUpdates, { transaction: appTransaction });
            }
          }

          // Re-encrypt AppWebhookSecret
          const webhookSecrets = await AppWebhookSecret.findAll({
            attributes: ['id', 'secret'],
            transaction: appTransaction,
          });

          for (const secret of webhookSecrets) {
            if (secret.secret) {
              logger.info(`Updating app ${app.id} AppWebhookSecret ${secret.id} secret`);
              const decrypted = decrypt(secret.secret, oldAesSecret);
              const encrypted = encrypt(decrypted, newAesSecret);
              await secret.update({ secret: encrypted }, { transaction: appTransaction });
            }
          }
        });

        await appDB.close();
        logger.info(`Re-encrypted app database secrets for app ${app.id}`);
      }
    });
  }

  await db.close();
  logger.info('Re-encryption complete');
  process.exit(0);
}
