import { randomUUID } from 'crypto';
import { store } from '../data/store.js';
import { fail, ok } from '../utils/api-response.js';

function normalizeBooking(record, perspective = 'client') {
  const booking = record.booking || {};
  const customer = record.customer || {};
  const rescheduleRequest = record.rescheduleRequest || null;
  const vendor = store.vendors.find((entry) => entry.ownerUserId === record.vendorUserId);
  return {
    id: record.id,
    receiptNumber: record.receiptNumber,
    status: record.status,
    createdAt: record.createdAt,
    packageName: booking.packageName || '',
    photographer: booking.photographer || '',
    total: booking.total || 0,
    deposit: booking.deposit || 0,
    date: booking.date || null,
    time: booking.time || null,
    location: booking.location || null,
    vendorSlug: vendor?.slug || null,
    vendorName: vendor?.displayName || null,
    customer: perspective === 'vendor' ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : null,
    rescheduleReason: rescheduleRequest?.reason || '',
    rescheduleRequestedAt: rescheduleRequest?.requestedAt || null,
    vendorDecision: record.vendorDecision || null,
    vendorDecisionAt: record.vendorDecisionAt || null,
    galleryId: record.galleryId || null,
    galleryDeliveredAt: record.galleryDeliveredAt || null
  };
}

export function getClientBookings(req, res) {
  const userId = req.authUser.id;
  const email = req.authUser.email;

  const items = store.bookings
    .filter((record) => {
      const customerEmail = (record.customer?.email || '').toLowerCase();
      return customerEmail === email.toLowerCase() || record.customerUserId === userId;
    })
    .map((record) => normalizeBooking(record, 'client'))
    .reverse();

  return ok(res, { items }, 'Client bookings fetched');
}

export function getVendorBookings(req, res) {
  const authUser = req.authUser;
  const items = store.bookings
      .filter((booking) => {
        if (booking.vendorUserId && authUser?.id) {
          return booking.vendorUserId === authUser.id;
        }

        const hasVendorProfile = store.vendors.some(
          (vendor) => vendor.ownerUserId === authUser?.id
        );
        return hasVendorProfile;
      })
      .map((record) => normalizeBooking(record, 'vendor'))
    .reverse();

  return ok(res, { items }, 'Vendor bookings fetched');
}

export function cancelClientBooking(req, res) {
  const booking = store.bookings.find((entry) => entry.id === req.params.id);
  if (!booking) {
    return fail(res, 'Booking not found', 404);
  }

  const authUser = req.authUser;
  const isOwnerByUserId = booking.customerUserId && booking.customerUserId === authUser.id;
  const isOwnerByEmail =
    (booking.customer?.email || '').toLowerCase() === (authUser.email || '').toLowerCase();

  if (!isOwnerByUserId && !isOwnerByEmail) {
    return fail(res, 'Forbidden booking access', 403);
  }

  if (booking.status === 'CANCELED') {
    return ok(
      res,
      {
        id: booking.id,
        status: booking.status
      },
      'Booking already canceled'
    );
  }

  booking.status = 'CANCELED';
  booking.canceledAt = new Date().toISOString();

  return ok(
    res,
    {
      id: booking.id,
      status: booking.status,
      canceledAt: booking.canceledAt
    },
    'Booking canceled'
  );
}

export function payBookingBalance(req, res) {
  const booking = store.bookings.find((entry) => entry.id === req.params.id);
  if (!booking) {
    return fail(res, 'Booking not found', 404);
  }

  const authUser = req.authUser;
  const isOwnerByUserId = booking.customerUserId && booking.customerUserId === authUser.id;
  const isOwnerByEmail =
    (booking.customer?.email || '').toLowerCase() === (authUser.email || '').toLowerCase();

  if (!isOwnerByUserId && !isOwnerByEmail) {
    return fail(res, 'Forbidden booking access', 403);
  }

  const status = String(booking.status || '').toUpperCase();
  if (status === 'CANCELED') {
    return fail(res, 'Canceled bookings cannot be paid', 400);
  }

  const total = Number(booking.booking?.total || 0);
  const paid = Number(booking.booking?.deposit || 0);
  const due = Math.max(total - paid, 0);

  if (due <= 0) {
    return ok(
      res,
      {
        id: booking.id,
        paidInFull: true,
        amountPaid: 0,
        booking: normalizeBooking(booking, 'client')
      },
      'Booking already paid in full'
    );
  }

  booking.booking.deposit = Number((paid + due).toFixed(2));
  booking.balancePaidAt = new Date().toISOString();
  booking.paymentStatus = 'PAID_IN_FULL';

  store.payments.push({
    id: randomUUID(),
    bookingId: booking.id,
    payerUserId: booking.customerUserId || null,
    recipientUserId: booking.vendorUserId || null,
    amount: Number(due.toFixed(2)),
    currency: 'USD',
    type: 'BALANCE',
    status: 'SUCCEEDED',
    reference: `TXN-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString()
  });

  return ok(
    res,
    {
      id: booking.id,
      paidInFull: true,
      amountPaid: Number(due.toFixed(2)),
      booking: normalizeBooking(booking, 'client')
    },
    'Booking balance paid'
  );
}

export function rescheduleClientBooking(req, res) {
  const booking = store.bookings.find((entry) => entry.id === req.params.id);
  if (!booking) {
    return fail(res, 'Booking not found', 404);
  }

  const authUser = req.authUser;
  const isOwnerByUserId = booking.customerUserId && booking.customerUserId === authUser.id;
  const isOwnerByEmail =
    (booking.customer?.email || '').toLowerCase() === (authUser.email || '').toLowerCase();

  if (!isOwnerByUserId && !isOwnerByEmail) {
    return fail(res, 'Forbidden booking access', 403);
  }

  const status = String(booking.status || '').toUpperCase();
  if (status === 'CANCELED' || status === 'DELIVERED' || status === 'COMPLETED') {
    return fail(res, 'This booking cannot be rescheduled', 400);
  }

  const payload = req.body || {};
  const nextDate = String(payload.date || '').trim();
  const nextTime = String(payload.time || '').trim();
  const nextLocation = String(payload.location || booking.booking?.location || '').trim();
  const reason = String(payload.reason || '').trim();

  if (!nextDate || !nextTime) {
    return fail(res, 'Reschedule requires date and time', 400);
  }

  booking.booking = {
    ...booking.booking,
    date: nextDate,
    time: nextTime,
    location: nextLocation
  };
  booking.rescheduleRequest = {
    reason,
    requestedAt: new Date().toISOString(),
    requestedBy: authUser.id
  };
  booking.updatedAt = new Date().toISOString();
  booking.status = 'PENDING';

  return ok(
    res,
    {
      id: booking.id,
      booking: normalizeBooking(booking, 'client')
    },
    'Booking rescheduled'
  );
}

export function updateVendorBookingStatus(req, res) {
  const booking = store.bookings.find((entry) => entry.id === req.params.id);
  if (!booking) {
    return fail(res, 'Booking not found', 404);
  }

  const authUser = req.authUser;
  const isOwnedBooking = booking.vendorUserId && booking.vendorUserId === authUser.id;
  if (!isOwnedBooking) {
    return fail(res, 'Forbidden booking access', 403);
  }

  const nextStatus = String(req.body?.status || '').toUpperCase();
  const allowed = new Set(['CONFIRMED', 'CANCELED', 'COMPLETED']);
  if (!allowed.has(nextStatus)) {
    return fail(res, 'Invalid vendor status transition', 400);
  }

  const currentStatus = String(booking.status || '').toUpperCase();
  if (currentStatus === 'CANCELED' || currentStatus === 'COMPLETED') {
    return fail(res, 'Finalized bookings cannot be changed', 400);
  }

  booking.status = nextStatus;
  booking.updatedAt = new Date().toISOString();
  booking.vendorDecision = nextStatus;
  booking.vendorDecisionAt = new Date().toISOString();

  if (nextStatus === 'CONFIRMED') {
    booking.confirmedAt = booking.vendorDecisionAt;
  }

  if (nextStatus === 'COMPLETED') {
    booking.completedAt = booking.vendorDecisionAt;
  }

  if (nextStatus === 'CANCELED') {
    booking.canceledAt = booking.vendorDecisionAt;
  }

  return ok(
    res,
    {
      id: booking.id,
      booking: normalizeBooking(booking, 'vendor')
    },
    'Vendor booking status updated'
  );
}