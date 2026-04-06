import { randomUUID } from 'crypto';
import { z } from 'zod';
import { store } from '../data/store.js';
import { fail, ok } from '../utils/api-response.js';

const sendSchema = z.object({
  body: z.string().min(1)
});

const openConversationSchema = z
  .object({
    participantUserId: z.string().min(1).optional(),
    vendorSlug: z.string().min(1).optional()
  })
  .refine((value) => value.participantUserId || value.vendorSlug, {
    message: 'participantUserId or vendorSlug is required'
  });

function displayNameForUser(userId) {
  const user = store.users.find((entry) => entry.id === userId);
  return user ? user.fullName : 'Unknown User';
}

function findOrCreateConversation(userA, userB) {
  const existing = store.conversations.find((entry) => {
    return entry.participants.includes(userA) && entry.participants.includes(userB);
  });

  if (existing) {
    return { conversation: existing, created: false };
  }

  const now = new Date().toISOString();
  const conversation = {
    id: randomUUID(),
    participants: [userA, userB],
    updatedAt: now,
    messages: []
  };

  store.conversations.push(conversation);
  return { conversation, created: true };
}

export function openConversation(req, res) {
  const userId = req.authUser.id;
  const parsed = openConversationSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 'Invalid conversation payload', 400, parsed.error.flatten());
  }

  const payload = parsed.data;
  let participantUserId = payload.participantUserId || null;

  if (!participantUserId && payload.vendorSlug) {
    const vendor = store.vendors.find((entry) => entry.slug === payload.vendorSlug);
    if (!vendor || !vendor.ownerUserId) {
      return fail(res, 'Vendor conversation target not found', 404);
    }
    participantUserId = vendor.ownerUserId;
  }

  if (!participantUserId) {
    return fail(res, 'Conversation participant could not be resolved', 400);
  }

  if (participantUserId === userId) {
    return fail(res, 'Cannot open conversation with yourself', 400);
  }

  const targetUser = store.users.find((entry) => entry.id === participantUserId);
  if (!targetUser) {
    return fail(res, 'Conversation participant not found', 404);
  }

  const { conversation, created } = findOrCreateConversation(userId, participantUserId);
  const lastMessage = conversation.messages[conversation.messages.length - 1] || null;

  return ok(
    res,
    {
      conversation: {
        id: conversation.id,
        participantName: displayNameForUser(participantUserId),
        updatedAt: conversation.updatedAt,
        lastMessage: lastMessage ? lastMessage.body : '',
        lastMessageAt: lastMessage ? lastMessage.sentAt : null,
        created
      }
    },
    created ? 'Conversation created' : 'Conversation opened',
    created ? 201 : 200
  );
}

export function listConversations(req, res) {
  const userId = req.authUser.id;

  const items = store.conversations
    .filter((conversation) => conversation.participants.includes(userId))
    .map((conversation) => {
      const lastMessage = conversation.messages[conversation.messages.length - 1] || null;
      const otherUserId = conversation.participants.find((participant) => participant !== userId) || userId;
      return {
        id: conversation.id,
        updatedAt: conversation.updatedAt,
        participantName: displayNameForUser(otherUserId),
        lastMessage: lastMessage ? lastMessage.body : '',
        lastMessageAt: lastMessage ? lastMessage.sentAt : null
      };
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return ok(res, { items }, 'Conversations fetched');
}

export function listMessages(req, res) {
  const userId = req.authUser.id;
  const conversation = store.conversations.find((entry) => entry.id === req.params.id);

  if (!conversation) {
    return fail(res, 'Conversation not found', 404);
  }

  if (!conversation.participants.includes(userId)) {
    return fail(res, 'Forbidden conversation access', 403);
  }

  return ok(
    res,
    {
      conversationId: conversation.id,
      items: conversation.messages.map((message) => ({
        ...message,
        senderName: displayNameForUser(message.senderUserId)
      }))
    },
    'Messages fetched'
  );
}

export function sendMessage(req, res) {
  const userId = req.authUser.id;
  const conversation = store.conversations.find((entry) => entry.id === req.params.id);
  if (!conversation) {
    return fail(res, 'Conversation not found', 404);
  }

  if (!conversation.participants.includes(userId)) {
    return fail(res, 'Forbidden conversation access', 403);
  }

  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 'Invalid message payload', 400, parsed.error.flatten());
  }

  const message = {
    id: randomUUID(),
    senderUserId: userId,
    body: parsed.data.body,
    sentAt: new Date().toISOString()
  };

  conversation.messages.push(message);
  conversation.updatedAt = message.sentAt;

  return ok(
    res,
    {
      conversationId: conversation.id,
      message: {
        ...message,
        senderName: displayNameForUser(userId)
      }
    },
    'Message sent',
    201
  );
}