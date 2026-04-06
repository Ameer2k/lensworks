import { store } from '../data/store.js';
import { fail, ok } from '../utils/api-response.js';
import { randomUUID } from 'crypto';
import { z } from 'zod';

function serializeVendor(vendor) {
  const packagePrices = Array.isArray(vendor.packages)
    ? vendor.packages.map((entry) => Number(entry.price || 0)).filter((value) => Number.isFinite(value) && value > 0)
    : [];

  return {
    id: vendor.id,
    slug: vendor.slug,
    displayName: vendor.displayName,
    tagline: vendor.tagline,
    city: vendor.city,
    rating: vendor.rating,
    reviewCount: vendor.reviewCount,
    coverImageUrl: vendor.coverImageUrl,
    avatarUrl: vendor.avatarUrl,
    styles: vendor.styles,
    startsAt: packagePrices.length ? Math.min(...packagePrices) : 0
  };
}

export function listVendors(req, res) {
  const query = (req.query.q || '').toString().trim().toLowerCase();
  const city = (req.query.city || '').toString().trim().toLowerCase();

  const items = store.vendors
    .filter((vendor) => {
      const matchesQuery =
        !query ||
        vendor.displayName.toLowerCase().includes(query) ||
        vendor.tagline.toLowerCase().includes(query);

      const matchesCity = !city || vendor.city.toLowerCase().includes(city);
      return matchesQuery && matchesCity;
    })
    .map(serializeVendor);

  return ok(res, { items, filters: req.query }, 'Vendor list fetched');
}

export function getVendorBySlug(req, res) {
  const vendor = store.vendors.find((entry) => entry.slug === req.params.slug);
  if (!vendor) {
    return fail(res, 'Vendor not found', 404);
  }

  return ok(
    res,
    {
      vendor: {
        ...serializeVendor(vendor),
        bio: vendor.bio || `${vendor.displayName} is a verified LensWorks photographer available for custom shoots.`
      }
    },
    'Vendor profile fetched'
  );
}


const reviewCreateSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().min(10)
});

export function getVendorReviews(req, res) {
  const vendor = store.vendors.find((entry) => entry.slug === req.params.slug);
  if (!vendor) {
    return fail(res, 'Vendor not found', 404);
  }

  return ok(res, { slug: vendor.slug, reviews: vendor.reviews }, 'Vendor reviews fetched');
}

export function createVendorReview(req, res) {
  const vendor = store.vendors.find((entry) => entry.slug === req.params.slug);
  if (!vendor) {
    return fail(res, 'Vendor not found', 404);
  }

  const parsed = reviewCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 'Invalid review payload', 400, parsed.error.flatten());
  }

  const authUser = req.authUser;
  const user = store.users.find((entry) => entry.id === authUser?.id);
  if (!user) {
    return fail(res, 'User not found', 404);
  }

  if (vendor.ownerUserId && vendor.ownerUserId === user.id) {
    return fail(res, 'You cannot review your own vendor profile', 400);
  }

  const payload = parsed.data;
  const review = {
    id: randomUUID(),
    rating: Number(payload.rating),
    author: user.fullName,
    body: payload.body.trim(),
    createdAt: new Date().toISOString()
  };

  vendor.reviews = [review, ...(vendor.reviews || [])];
  vendor.reviewCount = vendor.reviews.length;
  vendor.rating = Number(
    (
      vendor.reviews.reduce((sum, entry) => sum + Number(entry.rating || 0), 0)
      / Math.max(vendor.reviewCount, 1)
    ).toFixed(1)
  );

  return ok(
    res,
    {
      slug: vendor.slug,
      review,
      rating: vendor.rating,
      reviewCount: vendor.reviewCount
    },
    'Vendor review created',
    201
  );
}

export function getVendorPackages(req, res) {
  const vendor = store.vendors.find((entry) => entry.slug === req.params.slug);
  if (!vendor) {
    return fail(res, 'Vendor not found', 404);
  }

  return ok(res, { slug: vendor.slug, packages: vendor.packages }, 'Vendor packages fetched');
}

const packageCreateSchema = z.object({
  name: z.string().min(2),
  price: z.coerce.number().positive(),
  description: z.string().min(3).optional().default('')
});

const packageUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  price: z.coerce.number().positive().optional(),
  description: z.string().min(3).optional()
});

function serializePackage(entry) {
  return {
    id: entry.id,
    name: entry.name,
    price: Number(entry.price || 0),
    description: entry.description || ''
  };
}

function getVendorForAuthUser(req) {
  const userId = req.authUser?.id;
  if (!userId) {
    return null;
  }

  return (
    store.vendors.find((entry) => entry.ownerUserId === userId)
    || store.vendors.find((entry) => entry.displayName === req.authUser?.fullName)
    || null
  );
}

export function getMyVendorPackages(req, res) {
  const vendor = getVendorForAuthUser(req);
  if (!vendor) {
    return fail(res, 'Vendor profile not found for this account', 404);
  }

  return ok(
    res,
    {
      vendor: {
        id: vendor.id,
        slug: vendor.slug,
        displayName: vendor.displayName
      },
      packages: vendor.packages.map(serializePackage)
    },
    'Vendor packages fetched'
  );
}

export function createMyVendorPackage(req, res) {
  const vendor = getVendorForAuthUser(req);
  if (!vendor) {
    return fail(res, 'Vendor profile not found for this account', 404);
  }

  const parsed = packageCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 'Invalid package payload', 400, parsed.error.flatten());
  }

  const payload = parsed.data;
  const nextPackage = {
    id: randomUUID(),
    name: payload.name.trim(),
    price: Number(payload.price),
    description: payload.description?.trim() || ''
  };

  vendor.packages.push(nextPackage);

  return ok(res, { package: serializePackage(nextPackage) }, 'Vendor package created', 201);
}

export function updateMyVendorPackage(req, res) {
  const vendor = getVendorForAuthUser(req);
  if (!vendor) {
    return fail(res, 'Vendor profile not found for this account', 404);
  }

  const target = vendor.packages.find((entry) => entry.id === req.params.packageId);
  if (!target) {
    return fail(res, 'Package not found', 404);
  }

  const parsed = packageUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 'Invalid package payload', 400, parsed.error.flatten());
  }

  const payload = parsed.data;
  if (typeof payload.name === 'string') {
    target.name = payload.name.trim();
  }
  if (typeof payload.price === 'number') {
    target.price = Number(payload.price);
  }
  if (typeof payload.description === 'string') {
    target.description = payload.description.trim();
  }

  return ok(res, { package: serializePackage(target) }, 'Vendor package updated');
}

export function deleteMyVendorPackage(req, res) {
  const vendor = getVendorForAuthUser(req);
  if (!vendor) {
    return fail(res, 'Vendor profile not found for this account', 404);
  }

  const before = vendor.packages.length;
  vendor.packages = vendor.packages.filter((entry) => entry.id !== req.params.packageId);
  if (vendor.packages.length === before) {
    return fail(res, 'Package not found', 404);
  }

  return ok(res, { packageId: req.params.packageId }, 'Vendor package deleted');
}