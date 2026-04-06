import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { store } from '../data/store.js';
import { fail, ok } from '../utils/api-response.js';

const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  studioName: z.string().optional().default(''),
  tagline: z.string().max(60).optional().default(''),
  location: z.string().min(1),
  biography: z.string().optional().default('')
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

const notificationsSchema = z.object({
  bookingRequests: z.boolean(),
  directMessages: z.boolean(),
  smsAlerts: z.boolean(),
  marketingUpdates: z.boolean()
});

const contactSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().trim().max(40).optional()
});

const socialSchema = z.object({
  platform: z.enum(['instagram', 'google']),
  connected: z.boolean(),
  handle: z.string().trim().max(80).optional().default('')
});

function getUserOrFail(req, res) {
  const user = store.users.find((entry) => entry.id === req.authUser.id);
  if (!user) {
    fail(res, 'User not found', 404);
    return null;
  }
  return user;
}

function getProfile(user) {
  const existing = store.profileByUserId[user.id] || {};
  const [firstName, ...rest] = user.fullName.split(' ');
  return {
    firstName: existing.firstName || firstName || '',
    lastName: existing.lastName || rest.join(' ') || '',
    studioName: existing.studioName || '',
    tagline: existing.tagline || '',
    location: existing.location || '',
    biography: existing.biography || ''
  };
}

function getNotifications(user) {
  return (
    store.notificationsByUserId[user.id] || {
      bookingRequests: true,
      directMessages: true,
      smsAlerts: false,
      marketingUpdates: false
    }
  );
}

function getAccountDetails(user) {
  const existing = store.accountByUserId[user.id] || {};
  const socials = existing.socialAccounts || {};

  return {
    email: user.email,
    phone: existing.phone || '',
    socialAccounts: {
      instagram: {
        connected: Boolean(socials.instagram?.connected),
        handle: String(socials.instagram?.handle || '')
      },
      google: {
        connected: Boolean(socials.google?.connected),
        handle: String(socials.google?.handle || '')
      }
    }
  };
}

export function getAccountSettings(req, res) {
  const user = getUserOrFail(req, res);
  if (!user) {
    return;
  }

  return ok(
    res,
    {
      profile: getProfile(user),
      notifications: getNotifications(user),
      account: getAccountDetails(user)
    },
    'Account settings fetched'
  );
}

export function updateProfile(req, res) {
  const user = getUserOrFail(req, res);
  if (!user) {
    return;
  }

  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 'Invalid profile payload', 400, parsed.error.flatten());
  }

  const nextProfile = parsed.data;
  store.profileByUserId[user.id] = nextProfile;
  user.fullName = `${nextProfile.firstName} ${nextProfile.lastName}`.trim();
  user.updatedAt = new Date().toISOString();

  if (user.role === 'vendor') {
    const vendor = store.vendors.find((entry) => entry.ownerUserId === user.id);
    if (vendor) {
      vendor.displayName = user.fullName || vendor.displayName;
      vendor.tagline = nextProfile.tagline || vendor.tagline;
      vendor.city = nextProfile.location || vendor.city;
      vendor.bio = nextProfile.biography || vendor.bio;
    }
  }

  return ok(res, { profile: nextProfile }, 'Profile updated');
}

export async function updatePassword(req, res) {
  const user = getUserOrFail(req, res);
  if (!user) {
    return;
  }

  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 'Invalid password payload', 400, parsed.error.flatten());
  }

  const payload = parsed.data;
  const validCurrent = await bcrypt.compare(payload.currentPassword, user.passwordHash);
  if (!validCurrent) {
    return fail(res, 'Current password is incorrect', 400);
  }

  user.passwordHash = await bcrypt.hash(payload.newPassword, 10);
  user.updatedAt = new Date().toISOString();

  return ok(res, { updated: true }, 'Password updated');
}

export function updateNotifications(req, res) {
  const user = getUserOrFail(req, res);
  if (!user) {
    return;
  }

  const parsed = notificationsSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 'Invalid notification payload', 400, parsed.error.flatten());
  }

  store.notificationsByUserId[user.id] = parsed.data;
  user.updatedAt = new Date().toISOString();

  return ok(res, { notifications: parsed.data }, 'Notification preferences updated');
}

export function updateContact(req, res) {
  const user = getUserOrFail(req, res);
  if (!user) {
    return;
  }

  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 'Invalid contact payload', 400, parsed.error.flatten());
  }

  const payload = parsed.data;
  const details = store.accountByUserId[user.id] || {
    phone: '',
    socialAccounts: {
      instagram: { connected: false, handle: '' },
      google: { connected: false, handle: '' }
    }
  };

  if (typeof payload.email === 'string') {
    const nextEmail = payload.email.toLowerCase();
    const conflict = store.users.find(
      (entry) => entry.id !== user.id && entry.email.toLowerCase() === nextEmail
    );
    if (conflict) {
      return fail(res, 'An account with this email already exists', 409);
    }

    user.email = nextEmail;
  }

  if (typeof payload.phone === 'string') {
    details.phone = payload.phone;
  }

  user.updatedAt = new Date().toISOString();
  store.accountByUserId[user.id] = details;

  return ok(res, { account: getAccountDetails(user) }, 'Contact details updated');
}

export function updateSocial(req, res) {
  const user = getUserOrFail(req, res);
  if (!user) {
    return;
  }

  const parsed = socialSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 'Invalid social payload', 400, parsed.error.flatten());
  }

  const payload = parsed.data;
  const details = store.accountByUserId[user.id] || {
    phone: '',
    socialAccounts: {
      instagram: { connected: false, handle: '' },
      google: { connected: false, handle: '' }
    }
  };

  const socials = details.socialAccounts || {};
  socials[payload.platform] = {
    connected: payload.connected,
    handle: payload.connected ? payload.handle : ''
  };

  details.socialAccounts = socials;
  store.accountByUserId[user.id] = details;
  user.updatedAt = new Date().toISOString();

  return ok(res, { account: getAccountDetails(user) }, 'Social account updated');
}
