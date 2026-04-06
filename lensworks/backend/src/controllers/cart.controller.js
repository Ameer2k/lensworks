import { randomUUID } from 'crypto';
import { store } from '../data/store.js';
import { fail, ok } from '../utils/api-response.js';
import { getOrCreateSessionId } from '../utils/auth.js';

function getSessionCart(req, res) {
  const sessionId = getOrCreateSessionId(req, res);
  if (!store.cartsBySession.has(sessionId)) {
    store.cartsBySession.set(sessionId, { items: [], promo: null, updatedAt: new Date().toISOString() });
  }

  return {
    sessionId,
    cart: store.cartsBySession.get(sessionId)
  };
}

function touchCart(cart) {
  cart.updatedAt = new Date().toISOString();
}

export function getCart(req, res) {
  const { cart } = getSessionCart(req, res);
  return ok(
    res,
    {
      items: cart.items,
      promo: cart.promo,
      count: cart.items.length,
      updatedAt: cart.updatedAt
    },
    'Cart fetched'
  );
}

export function addCartItem(req, res) {
  const { cart } = getSessionCart(req, res);
  const payload = req.body || {};

  const id = payload.id || randomUUID();
  const nextItem = {
    ...payload,
    id
  };

  const index = cart.items.findIndex((entry) => entry.id === id);
  if (index >= 0) {
    cart.items[index] = nextItem;
  } else {
    cart.items.push(nextItem);
  }

  touchCart(cart);
  return ok(res, { item: nextItem, count: cart.items.length }, 'Cart item added', 201);
}

export function updateCartItem(req, res) {
  const { cart } = getSessionCart(req, res);
  const { id } = req.params;
  const index = cart.items.findIndex((entry) => entry.id === id);

  if (index < 0) {
    return fail(res, 'Cart item not found', 404);
  }

  cart.items[index] = {
    ...cart.items[index],
    ...(req.body || {}),
    id
  };

  touchCart(cart);
  return ok(res, { item: cart.items[index], count: cart.items.length }, 'Cart item updated');
}

export function deleteCartItem(req, res) {
  const { cart } = getSessionCart(req, res);
  const { id } = req.params;
  const before = cart.items.length;
  cart.items = cart.items.filter((entry) => entry.id !== id);

  if (before === cart.items.length) {
    return fail(res, 'Cart item not found', 404);
  }

  touchCart(cart);
  return ok(res, { id, count: cart.items.length }, 'Cart item removed');
}

export function applyPromo(req, res) {
  const { cart } = getSessionCart(req, res);
  const code = String(req.body?.code || '').trim().toUpperCase();
  const discount = store.promos[code];

  if (!discount) {
    return fail(res, 'Invalid promo code', 400);
  }

  cart.promo = { code, discount };
  touchCart(cart);
  return ok(res, { code, discount }, 'Promo applied');
}