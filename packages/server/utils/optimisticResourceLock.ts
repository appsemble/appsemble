// CSpell:ignore Includeable
import {
  assertKoaCondition,
  createResourceEtag,
  matchesResourceIfMatch,
  throwResourcePreconditionFailedKoaError,
} from '@appsemble/node-utils';
import { type Context } from 'koa';
import {
  type Includeable,
  type Model,
  type ModelStatic,
  type Transaction,
  type WhereOptions,
} from 'sequelize';

interface LockOptions<M extends Model> {
  context: Context;
  transaction: Transaction;
  Resource: ModelStatic<M>;
  where: WhereOptions;
  include?: Includeable[];
  ifMatch?: string | string[];
  resourceType: string;
  resourceId: number | string;

  /**
   * Project the locked model into the object to hash. Must mirror the
   * projection used to build the response body, otherwise the ETag of version
   * N round-tripped by the client will not match the ETag the server computes
   * for the same version N. Defaults to `m.toJSON()`.
   */
  serializeForEtag?: (model: M) => Record<string, unknown>;
}

/**
 * Lock a single resource row for update, then enforce an `If-Match` precondition
 * against its current ETag inside the same transaction. Throws 404 if the row
 * does not match the where-clause, and 412 if the precondition fails.
 *
 * The hash is only computed when `ifMatch` is present — pay-for-play.
 *
 * @param options Lock target, transaction, optional `If-Match` header value, and
 *   an optional `serializeForEtag` projection that must mirror the response body.
 * @returns The locked model instance.
 */
export async function lockResourceWithIfMatch<M extends Model>(
  options: LockOptions<M>,
): Promise<M> {
  const {
    context,
    transaction,
    Resource,
    where,
    include,
    ifMatch,
    resourceType,
    resourceId,
    serializeForEtag = (model) => model.toJSON() as Record<string, unknown>,
  } = options;
  const locked = await Resource.findOne({
    where,
    include,
    lock: transaction.LOCK.UPDATE,
    transaction,
  });

  assertKoaCondition(locked != null, context, 404, 'Resource not found');

  if (ifMatch && !matchesResourceIfMatch(ifMatch, createResourceEtag(serializeForEtag(locked)))) {
    throwResourcePreconditionFailedKoaError(context, resourceType, resourceId);
  }

  return locked;
}
