import { type ActionDefinition } from '@appsemble/types';

import { query } from './resource.js';
import { App } from '../../models/App.js';
import { Organization } from '../../models/Organization.js';
import { Resource } from '../../models/Resource.js';
import { options } from '../../options/options.js';
import { handleAction } from '../action.js';
import { argv, setArgv } from '../argv.js';
import { Mailer } from '../email/Mailer.js';
import { useTestDatabase } from '../test/testSchema.js';

useTestDatabase(import.meta);

let mailer: Mailer;

beforeEach(() => {
  setArgv({ host: 'https://example.com' });
  mailer = new Mailer(argv);
  Organization.create({ id: 'testorg' });
  import.meta.jest.useFakeTimers({ now: new Date('2022-02-02T22:22:22Z') });
});

describe('resource.query', () => {
  it('should query resources', async () => {
    const action: ActionDefinition = {
      type: 'resource.query',
      resource: 'person',
    };
    const app = await App.create({
      OrganizationId: 'testorg',
      vapidPrivateKey: '',
      vapidPublicKey: '',
      definition: {
        defaultPage: '',
        resources: {
          person: {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                name: { type: 'string' },
              },
            },
          },
        },
        pages: [],
        cron: {
          list: {
            schedule: '* * * * *',
            action,
          },
        },
      },
    } as Partial<App>);
    await Resource.create({
      AppId: app.id,
      type: 'person',
      data: { name: 'Spongebob' },
    });
    await Resource.create({
      AppId: app.id,
      type: 'person',
      data: { name: 'Patrick' },
    });

    const result = await handleAction(query, {
      app,
      user: null,
      action,
      mailer,
      data: {},
      options,
      context: {} as any,
    });

    expect(result).toStrictEqual([
      {
        $created: '2022-02-02T22:22:22.000Z',
        $updated: '2022-02-02T22:22:22.000Z',
        id: 1,
        name: 'Spongebob',
      },
      {
        $created: '2022-02-02T22:22:22.000Z',
        $updated: '2022-02-02T22:22:22.000Z',
        id: 2,
        name: 'Patrick',
      },
    ]);
  });

  it('should support views', async () => {
    const action: ActionDefinition = {
      type: 'resource.query',
      resource: 'person',
      view: 'fullName',
    };
    const app = await App.create({
      OrganizationId: 'testorg',
      vapidPrivateKey: '',
      vapidPublicKey: '',
      definition: {
        defaultPage: '',
        resources: {
          person: {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                firstName: { type: 'string' },
                lastName: { type: 'string' },
              },
            },
            views: {
              fullName: {
                roles: ['$public'],
                remap: {
                  'object.from': {
                    fullName: {
                      'string.format': {
                        template: '{firstName} {lastName}',
                        values: {
                          firstName: { prop: 'firstName' },
                          lastName: { prop: 'lastName' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        pages: [],
        cron: {
          list: {
            schedule: '* * * * *',
            action,
          },
        },
      },
    } as Partial<App>);
    await Resource.create({
      AppId: app.id,
      type: 'person',
      data: { firstName: 'Spongebob', lastName: 'Squarepants' },
    });
    await Resource.create({
      AppId: app.id,
      type: 'person',
      data: { firstName: 'Patrick', lastName: 'Star' },
    });

    const result = await handleAction(query, {
      app,
      user: null,
      action,
      mailer,
      data: {},
      options,
      context: {} as any,
    });

    expect(result).toStrictEqual([
      { fullName: 'Spongebob Squarepants' },
      { fullName: 'Patrick Star' },
    ]);
  });
});
