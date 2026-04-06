import { randomUUID } from 'crypto';
import { store } from '../data/store.js';
import { fail, ok } from '../utils/api-response.js';
import { getOrCreateSessionId, readAuthUser } from '../utils/auth.js';

function makeReceipt() {
  const stamp = Date.now().toString(36).slice(-6).toUpperCase();
  return `LW-${stamp}`;
}

function resolveVendorUserId(booking = {}) {
  const vendorSlug = String(booking.vendorSlug || '').trim();
  if (vendorSlug) {
    const bySlug = store.vendors.find((entry) => entry.slug === vendorSlug);
    if (bySlug?.ownerUserId) {
      return bySlug.ownerUserId;
    }
  }

  const photographer = String(booking.photographer || '').trim().toLowerCase();
  if (photographer) {
    const byName = store.vendors.find((entry) => String(entry.displayName || '').trim().toLowerCase() === photographer);
    if (byName?.ownerUserId) {
      return byName.ownerUserId;
    }
  }

  const fallbackVendor = store.vendors.find((entry) => entry.ownerUserId);
  return fallbackVendor?.ownerUserId || null;
}

export function confirmCheckout(req, res) {
  const payload = req.body || {};
  const booking = payload.booking;
  const customer = payload.customer;

  if (!booking || !customer?.email) {
    return fail(res, 'Invalid checkout payload', 400);
  }

  const sessionId = getOrCreateSessionId(req, res);
  const authUser = readAuthUser(req);
  const userByEmail = store.users.find(
    (entry) => entry.email.toLowerCase() === String(customer.email).toLowerCase()
  );

  const customerUserId = authUser?.id || userByEmail?.id || null;
  const vendorUserId = resolveVendorUserId(booking);
  const receiptNumber = makeReceipt();
  const bookingRecord = {
    id: randomUUID(),
    receiptNumber,
    sessionId,
    customerUserId,
    vendorUserId,
    customer: {
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      email: customer.email
    },
    booking,
    status: 'CONFIRMED',
    createdAt: new Date().toISOString()
  };

  store.bookings.push(bookingRecord);

  const depositAmount = Number(bookingRecord.booking?.deposit || 0);
  if (depositAmount > 0) {
    store.payments.push({
      id: randomUUID(),
      bookingId: bookingRecord.id,
      payerUserId: customerUserId,
      recipientUserId: bookingRecord.vendorUserId,
      amount: depositAmount,
      currency: 'USD',
      type: 'DEPOSIT',
      status: 'SUCCEEDED',
      reference: `TXN-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString()
    });
  }

  if (store.cartsBySession.has(sessionId)) {
    store.cartsBySession.set(sessionId, {
      items: [],
      promo: null,
      updatedAt: new Date().toISOString()
    });
  }

  return ok(
    res,
    {
      bookingId: bookingRecord.id,
      receiptNumber: bookingRecord.receiptNumber,
      status: bookingRecord.status
    },
    'Checkout confirmed',
    201
  );
}