import { ok } from '../utils/api-response.js';

export function getHealth(req, res) {
  return ok(res, { status: 'healthy' }, 'Backend is running');
}