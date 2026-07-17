import { PredefinedOrganizationRole, type Resource as ResourceType } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type App,
  getAppDB,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';
import { exampleApp } from '../../../../utils/test/exampleApp.js';

let organization: Organization;
let user: User;
let app: App;

/**
 * Metamorphic tests for the OData `$filter` to Sequelize translation.
 *
 * Instead of pinning the exact rows a single filter returns, these assert algebraic laws that must
 * hold between related filters regardless of how each compiles to SQL: negation, De Morgan,
 * commutativity and idempotence. They exercise the translator through the real resource query
 * endpoint against a real PostgreSQL, so any translation that silently drops a `not`, mishandles
 * three-valued logic or diverges between equivalent forms breaks a law without anyone having to
 * predict the concrete result set.
 */
describe('queryAppResources OData filter laws', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    vi.clearAllTimers();
    vi.setSystemTime(0);
    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      UserId: user.id,
      OrganizationId: organization.id,
      role: PredefinedOrganizationRole.Maintainer,
    });
    app = await exampleApp(organization.id);

    const { Resource } = await getAppDB(app.id);
    // A dataset where every predicate below evaluates to true for some rows, false for others and
    // null for rows whose compared value is absent or explicitly null.
    await Resource.bulkCreate([
      { type: 'testResource', data: { foo: 'apple', bar: 'x' } },
      { type: 'testResource', data: { foo: 'apricot', bar: 'y' } },
      { type: 'testResource', data: { foo: 'banana' } },
      { type: 'testResource', data: { foo: 'cherry', bar: null } },
      { type: 'testResource', data: { foo: 'avocado', bar: 'x' } },
    ]);
    authorizeStudio();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  // The ids a filter matches, sorted so comparisons are order-insensitive.
  async function ids(filter: string): Promise<number[]> {
    const response = await request.get(`/api/apps/${app.id}/resources/testResource`, {
      params: { $filter: filter },
    });
    expect(response.status, `filter "${filter}" returned ${JSON.stringify(response.data)}`).toBe(
      200,
    );
    return (response.data as ResourceType[]).map((resource) => resource.id).sort((a, b) => a - b);
  }

  // Every id, for the totality law below.
  async function allIds(): Promise<number[]> {
    const response = await request.get(`/api/apps/${app.id}/resources/testResource`);
    return (response.data as ResourceType[]).map((resource) => resource.id).sort((a, b) => a - b);
  }

  // Leaf predicates covering the translator's paths: data-property equality and inequality, the
  // three string functions (each compiles to a different operator), a null check and a regular
  // column comparison.
  const predicates = [
    "foo eq 'apple'",
    "foo ne 'apple'",
    "contains(foo, 'a')",
    "startswith(foo, 'ap')",
    "endswith(foo, 'a')",
    'bar eq null',
    'id gt 2',
  ];

  // Pairs used for the binary laws; chosen to mix property comparisons, string functions, a null
  // check and the regular column.
  const pairs: [string, string][] = [
    ["foo eq 'apple'", "bar eq 'x'"],
    ["contains(foo, 'a')", 'id gt 2'],
    ["startswith(foo, 'ap')", 'bar eq null'],
  ];

  it.each(predicates)('cancels a double negation: %s', async (p) => {
    expect(await ids(`not (not (${p}))`)).toStrictEqual(await ids(p));
  });

  it.each(predicates)('a predicate and its negation never overlap: %s', async (p) => {
    const positive = await ids(p);
    const negative = await ids(`not (${p})`);
    expect(positive.filter((id) => negative.includes(id))).toStrictEqual([]);
  });

  it('a total predicate and its negation cover every row', async () => {
    const positive = await ids('id gt 2');
    const negative = await ids('not (id gt 2)');
    expect([...positive, ...negative].sort((a, b) => a - b)).toStrictEqual(await allIds());
  });

  it.each(pairs)('and is commutative: %s / %s', async (a, b) => {
    expect(await ids(`${a} and ${b}`)).toStrictEqual(await ids(`${b} and ${a}`));
  });

  it.each(pairs)('or is commutative: %s / %s', async (a, b) => {
    expect(await ids(`${a} or ${b}`)).toStrictEqual(await ids(`${b} or ${a}`));
  });

  it.each(pairs)('distributes not over and (De Morgan): %s / %s', async (a, b) => {
    expect(await ids(`not (${a} and ${b})`)).toStrictEqual(
      await ids(`(not (${a})) or (not (${b}))`),
    );
  });

  it.each(pairs)('distributes not over or (De Morgan): %s / %s', async (a, b) => {
    expect(await ids(`not (${a} or ${b})`)).toStrictEqual(
      await ids(`(not (${a})) and (not (${b}))`),
    );
  });

  it.each(predicates)('and is idempotent: %s', async (p) => {
    expect(await ids(`${p} and ${p}`)).toStrictEqual(await ids(p));
  });

  it.each(predicates)('or is idempotent: %s', async (p) => {
    expect(await ids(`${p} or ${p}`)).toStrictEqual(await ids(p));
  });
});
