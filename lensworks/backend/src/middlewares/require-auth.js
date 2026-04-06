import { fail } from '../utils/api-response.js';
import { readAuthUser } from '../utils/auth.js';

export function requireAuth(req, res, next) {
  const authUser = readAuthUser(req);
  if (!authUser) {
    return fail(res, 'Not authenticated', 401);
  }

  req.authUser = authUser;
  return next();
}
