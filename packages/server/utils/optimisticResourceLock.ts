import {
  assertKoaCondition,
  createResourceEtag,
  matchesResourceIfMatch,
  throwResourcePreconditionFailedKoaError,
} from '@appsemble/node-utils';
import { type Context } from 'koa';
import {
  type Includeable,
  type ModelStatic,
  type Transaction,
  type WhereOptions,
} from 'sequelize';

interface LockOptions<M> {
  context: Context;
  transaction: Transaction;
  Resource: ModelStatic<M>;
  where: WhereOptions;
  include?: Includeable[];
  ifMatch?: string | string[];
  resourceType: string;
  resourceId: number | string;
}

/**
 * Lock a single resource row for update, then enforce an `If-Match` precondition
 * against its current ETag inside the same transaction. Throws 404 if the row
 * does not match the where-clause, and 412 if the precondition fails.
 *
 * The hash is only computed when `ifMatch` is present — pay-for-play.
 */
export async function lockResourceWithIfMatch<M extends { toJSON: () => Record<string, unknown> }>({
  context,
  transaction,
  Resource,
  where,
  include,
  ifMatch,
  resourceType,
  resourceId,
}: LockOptions<M>): Promise<M> {
  const locked = await Resource.findOne({
    where,
    include,
    lock: transaction.LOCK.UPDATE,
    transaction,
  });

  assertKoaCondition(locked != null, context, 404, 'Resource not found');

  if (ifMatch && !matchesResourceIfMatch(ifMatch, createResourceEtag(locked.toJSON()))) {
    throwResourcePreconditionFailedKoaError(context, resourceType, resourceId);
  }

  return locked;
}
