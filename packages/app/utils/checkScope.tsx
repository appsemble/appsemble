import { User } from '../types';

/**
 * Check if the given user has access to any of the given scopes.
 *
 * @param scopes The scopes to check against.
 * @param user The user to verify.
 * @returns Wether or not the user has access to any of the given scopes.
 */
export default function checkScope(scopes: string[], user: User): boolean {
  if (!scopes) {
    return true;
  }
  if (scopes.includes('*')) {
    return !!user;
  }
  // XXX implement scope based authentication.
  return false;
}
