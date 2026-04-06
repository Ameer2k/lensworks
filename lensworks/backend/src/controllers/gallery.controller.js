import { store } from '../data/store.js';
import { fail, ok } from '../utils/api-response.js';
import { randomUUID } from 'crypto';

const demoGalleryAssets = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop'
];

export function listMyGalleries(req, res) {
  const userId = req.authUser.id;
  const items = store.galleries
    .filter((entry) => entry.ownerUserIds.includes(userId))
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      photoCount: Array.isArray(entry.assets) ? entry.assets.length : 0,
      coverImageUrl: entry.assets?.[0]?.thumbnailUrl || entry.assets?.[0]?.assetUrl || ''
    }));

  return ok(res, { items }, 'Galleries fetched');
}

export function getGallery(req, res) {
  const userId = req.authUser.id;
  const gallery = store.galleries.find((entry) => entry.id === req.params.id);

  if (!gallery) {
    return fail(res, 'Gallery not found', 404);
  }

  if (!gallery.ownerUserIds.includes(userId)) {
    return fail(res, 'Forbidden gallery access', 403);
  }

  const booking = store.bookings.find((entry) => entry.galleryId === gallery.id) || null;
  const viewerUser = store.users.find((entry) => entry.id === userId) || null;
  const vendorUser = booking?.vendorUserId
    ? store.users.find((entry) => entry.id === booking.vendorUserId)
    : null;

  const assets = [...gallery.assets].sort((left, right) => left.sortOrder - right.sortOrder);
  return ok(
    res,
    {
      id: gallery.id,
      title: gallery.title,
      viewerName: viewerUser?.fullName || 'LensWorks User',
      photographerName: vendorUser?.fullName || 'LensWorks Pro',
      assets
    },
    'Gallery fetched'
  );
}

export function deliverGalleryForBooking(req, res) {
  const authUserId = req.authUser.id;
  const bookingId = String(req.body?.bookingId || '').trim();
  if (!bookingId) {
    return fail(res, 'bookingId is required', 400);
  }

  const booking = store.bookings.find((entry) => entry.id === bookingId);
  if (!booking) {
    return fail(res, 'Booking not found', 404);
  }

  if (!booking.vendorUserId || booking.vendorUserId !== authUserId) {
    return fail(res, 'Forbidden booking access', 403);
  }

  const status = String(booking.status || '').toUpperCase();
  if (status !== 'COMPLETED') {
    return fail(res, 'Booking must be completed before delivery', 400);
  }

  if (booking.galleryId) {
    const existing = store.galleries.find((entry) => entry.id === booking.galleryId);
    if (existing) {
      booking.galleryDeliveredAt = booking.galleryDeliveredAt || new Date().toISOString();
      return ok(
        res,
        {
          gallery: {
            id: existing.id,
            title: existing.title,
            photoCount: Array.isArray(existing.assets) ? existing.assets.length : 0,
            coverImageUrl: existing.assets?.[0]?.thumbnailUrl || existing.assets?.[0]?.assetUrl || ''
          },
          booking: {
            id: booking.id,
            galleryId: booking.galleryId,
            galleryDeliveredAt: booking.galleryDeliveredAt
          }
        },
        'Gallery already delivered'
      );
    }
  }

  const title = `${booking.booking?.packageName || 'Session'} - Delivered Gallery`;
  const assets = demoGalleryAssets.map((url, index) => ({
    id: randomUUID(),
    assetUrl: url,
    thumbnailUrl: `${url}&w=600`,
    isFavorite: index === 0,
    sortOrder: index + 1
  }));

  const ownerUserIds = [booking.vendorUserId].filter(Boolean);
  if (booking.customerUserId) {
    ownerUserIds.push(booking.customerUserId);
  }

  const gallery = {
    id: randomUUID(),
    title,
    ownerUserIds: Array.from(new Set(ownerUserIds)),
    assets
  };

  store.galleries.push(gallery);
  booking.galleryId = gallery.id;
  booking.galleryDeliveredAt = new Date().toISOString();

  return ok(
    res,
    {
      gallery: {
        id: gallery.id,
        title: gallery.title,
        photoCount: gallery.assets.length,
        coverImageUrl: gallery.assets?.[0]?.thumbnailUrl || gallery.assets?.[0]?.assetUrl || ''
      },
      booking: {
        id: booking.id,
        galleryId: booking.galleryId,
        galleryDeliveredAt: booking.galleryDeliveredAt
      }
    },
    'Gallery delivered',
    201
  );
}