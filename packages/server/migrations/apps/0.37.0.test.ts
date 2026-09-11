import { describe, expect, it } from 'vitest';

import { up } from './0.37.0.js';
import { App, getAppDB, Organization } from '../../models/index.js';

describe('migration 0.37.0', () => {
  it('should not throw when the added columns already exist', async () => {
    await Organization.create({ id: 'testorganization', name: 'Test Organization' });
    const app = await App.create({
      OrganizationId: 'testorganization',
      definition: { name: 'Test App', defaultPage: 'Test' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
    });

    // The app database is built from the current models, so `roleMappings` and `groupAttribute`
    // are already present. Rerunning `up()` must be a no-op instead of throwing
    // `column already exists`, so awaiting it here fails the test if the migration is not
    // idempotent.
    const { sequelize } = await getAppDB(app.id);

    await sequelize.transaction((transaction) => up(transaction, sequelize));

    const oauth2Columns = await sequelize.getQueryInterface().describeTable('AppOAuth2Secret');
    expect(oauth2Columns).toHaveProperty('roleMappings');
    const samlColumns = await sequelize.getQueryInterface().describeTable('AppSamlSecret');
    expect(samlColumns).toHaveProperty('groupAttribute');
    expect(samlColumns).toHaveProperty('roleMappings');
  });
});
