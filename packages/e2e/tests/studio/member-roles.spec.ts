import { expect, authenticatedTest as test } from '../../index.js';

let membersAppId: number | undefined;
let membersAppPath: string | undefined;

test.describe('Studio member roles', () => {
  test.beforeAll(async ({ createApp, createOrganization, randomTestId }) => {
    const organizationId = (await createOrganization({ id: randomTestId() })).id;

    const app = await createApp(
      organizationId,
      `
        name: Member Roles App
        defaultPage: Test Page
        security:
          default:
            role: User
            policy: everyone
          roles:
            User: {}
            Admin: {}
            Auditor: {}
        pages:
          - name: Test Page
            blocks:
              - type: data-loader
                version: 0.34.15
      `,
    );

    membersAppId = app.id;
    membersAppPath = app.path;
  });

  test.afterAll(async ({ deleteApp }) => {
    if (membersAppId != null) {
      await deleteApp(membersAppId);
    }
  });

  test('should update multiple member roles in Studio', async ({ page, randomTestId, request }) => {
    const email = `${randomTestId()}@example.com`;
    const registration = new FormData();
    registration.append('email', email);
    registration.append('password', 'password');
    registration.append('timezone', 'Europe/Amsterdam');

    const registerResponse = await request.post(`/api/apps/${membersAppId}/auth/email/register`, {
      multipart: registration,
    });
    expect(registerResponse.status()).toBe(201);

    await page.goto(`/en/apps/${membersAppId}/${membersAppPath}/members`);

    const rolesSelect = page.getByTestId(`app-member-roles-${email}`);
    await rolesSelect.selectOption(['Admin', 'Auditor']);

    await expect(
      page.getByText(`Successfully changed roles of ${email} to Admin, Auditor.`),
    ).toBeVisible();

    await page.reload();

    await expect
      .poll(() =>
        page
          .getByTestId(`app-member-roles-${email}`)
          .evaluate((element) =>
            Array.from((element as HTMLSelectElement).selectedOptions, ({ value }) => value),
          ),
      )
      .toEqual(['Admin', 'Auditor']);
  });
});
