import { throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { UniqueConstraintError } from 'sequelize';

export function normalizeDomain(domain: string | null | undefined): string | null | undefined {
  if (domain == null) {
    return domain;
  }

  const normalizedDomain = domain.trim().toLowerCase();
  return normalizedDomain || null;
}

export function handleAppCollectionDomainValidationError(
  ctx: Context,
  error: unknown,
  domain: string | null | undefined,
): never {
  if (
    error instanceof UniqueConstraintError &&
    'constraint' in error.parent &&
    error.parent.constraint === 'UniqueAppCollectionDomain'
  ) {
    throwKoaError(ctx, 409, `Another app collection with domain '${domain}' already exists.`);
  }

  throw error;
}
