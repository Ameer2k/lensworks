import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { store } from '../data/store.js';
import { fail, ok } from '../utils/api-response.js';
import { clearAuthCookie, readAuthUser, setAuthCookie } from '../utils/auth.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.enum(['client', 'vendor']).default('client')
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const forgotSchema = z.object({
  email: z.string().email()
});

function sanitizeUser(user) {
  return {
    id: user.id,
    role: user.role,
    email: user.email,
    fullName: user.fullName,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ensureUniqueVendorSlug(baseName) {
  const base = slugify(baseName) || 'vendor';
  let candidate = base;
  let counter = 2;
  while (store.vendors.some((entry) => entry.slug === candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

export async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 'Invalid registration payload', 400, parsed.error.flatten());
  }

  const payload = parsed.data;
  const email = payload.email.toLowerCase();
  const existing = store.users.find((entry) => entry.email.toLowerCase() === email);
  if (existing) {
    return fail(res, 'An account with this email already exists', 409);
  }

  const now = new Date().toISOString();
  const user = {
    id: randomUUID(),
    role: payload.role,
    email,
    fullName: payload.fullName.trim(),
    passwordHash: await bcrypt.hash(payload.password, 10),
    createdAt: now,
    updatedAt: now
  };

  store.users.push(user);

  const [firstName, ...rest] = user.fullName.split(' ');
  store.profileByUserId[user.id] = {
    firstName: firstName || user.fullName,
    lastName: rest.join(' ') || '',
    studioName: user.role === 'vendor' ? `${user.fullName} Studio` : '',
    tagline: user.role === 'vendor' ? 'LensWorks Vendor' : 'Client Account',
    location: user.role === 'vendor' ? 'Manama' : '',
    biography:
      user.role === 'vendor'
        ? `${user.fullName} is a newly onboarded LensWorks vendor. Update this profile from account settings to personalize your brand and services.`
        : ''
  };

  store.accountByUserId[user.id] = {
    phone: '',
    socialAccounts: {
      instagram: { connected: false, handle: '' },
      google: { connected: false, handle: '' }
    }
  };

  if (user.role === 'vendor') {
    const vendorSlug = ensureUniqueVendorSlug(user.fullName);
    const vendorId = `ven_${vendorSlug}`;
    const packageId = `pkg_${vendorSlug}_starter`;
    store.vendors.push({
      id: vendorId,
      ownerUserId: user.id,
      slug: vendorSlug,
      displayName: user.fullName,
      tagline: 'LensWorks Vendor',
      city: 'Manama',
      rating: 5,
      reviewCount: 0,
      coverImageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=2000&auto=format&fit=crop',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop',
      styles: ['Cinematic'],
      bio: `${user.fullName} is a verified LensWorks vendor accepting new sessions.`,
      packages: [
        {
          id: packageId,
          name: 'Starter Session',
          price: 120,
          description: '1 Hour Coverage • 40+ Edited Photos'
        }
      ],
      reviews: []
    });
  }

  setAuthCookie(res, user);

  return ok(res, { user: sanitizeUser(user) }, 'Account created successfully', 201);
}

export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 'Invalid login payload', 400, parsed.error.flatten());
  }

  const payload = parsed.data;
  const user = store.users.find((entry) => entry.email.toLowerCase() === payload.email.toLowerCase());
  if (!user) {
    return fail(res, 'Invalid email or password', 401);
  }

  const passwordOk = await bcrypt.compare(payload.password, user.passwordHash);
  if (!passwordOk) {
    return fail(res, 'Invalid email or password', 401);
  }

  setAuthCookie(res, user);
  return ok(res, { user: sanitizeUser(user) }, 'Logged in successfully');
}

export function forgotPassword(req, res) {
  const parsed = forgotSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 'Invalid forgot-password payload', 400, parsed.error.flatten());
  }

  const email = parsed.data.email.toLowerCase();
  const exists = store.users.some((entry) => entry.email.toLowerCase() === email);

  store.forgotRequests.push({
    id: randomUUID(),
    email,
    requestedAt: new Date().toISOString(),
    exists
  });

  return ok(
    res,
    { accepted: true },
    'If an account exists for this email, reset instructions have been prepared.'
  );
}

export function me(req, res) {
  const authUser = readAuthUser(req);
  if (!authUser) {
    return fail(res, 'Not authenticated', 401);
  }

  const user = store.users.find((entry) => entry.id === authUser.id);
  if (!user) {
    return fail(res, 'Session user no longer exists', 404);
  }

  return ok(res, { user: sanitizeUser(user) }, 'Current user fetched');
}

export function logout(req, res) {
  clearAuthCookie(res);
  return ok(res, { loggedOut: true }, 'Logged out');
}