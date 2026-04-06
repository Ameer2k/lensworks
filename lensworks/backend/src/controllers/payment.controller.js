import { store } from '../data/store.js';
import { ok } from '../utils/api-response.js';

function toPaymentDto(record) {
  return {
    id: record.id,
    bookingId: record.bookingId,
    amount: Number(record.amount || 0),
    currency: record.currency || 'USD',
    type: record.type || 'PAYMENT',
    status: record.status || 'SUCCEEDED',
    reference: record.reference || '',
    createdAt: record.createdAt || null
  };
}

export function listMyPayments(req, res) {
  const userId = req.authUser.id;

  const items = store.payments
    .filter((entry) => entry.payerUserId === userId)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .map(toPaymentDto);

  return ok(res, { items }, 'Client payments fetched');
}

export function listVendorPayments(req, res) {
  const userId = req.authUser.id;

  const items = store.payments
    .filter((entry) => entry.recipientUserId === userId)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .map(toPaymentDto);

  return ok(res, { items }, 'Vendor payments fetched');
}
