import bcrypt from 'bcryptjs';

const now = new Date().toISOString();

const users = [
  {
    id: 'usr_client_demo',
    role: 'client',
    email: 'client@lensworks.app',
    fullName: 'Client Demo',
    passwordHash: bcrypt.hashSync('password123', 10),
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'usr_vendor_demo',
    role: 'vendor',
    email: 'vendor@lensworks.app',
    fullName: 'Vendor Demo',
    passwordHash: bcrypt.hashSync('password123', 10),
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'usr_vendor_david',
    role: 'vendor',
    email: 'david@lensworks.app',
    fullName: 'David Chen',
    passwordHash: bcrypt.hashSync('password123', 10),
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'usr_vendor_elena',
    role: 'vendor',
    email: 'elena@lensworks.app',
    fullName: 'Elena Rostova',
    passwordHash: bcrypt.hashSync('password123', 10),
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'usr_vendor_studio7',
    role: 'vendor',
    email: 'studio7@lensworks.app',
    fullName: 'Studio 7',
    passwordHash: bcrypt.hashSync('password123', 10),
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'usr_vendor_marcus',
    role: 'vendor',
    email: 'marcus@lensworks.app',
    fullName: 'Marcus Field',
    passwordHash: bcrypt.hashSync('password123', 10),
    createdAt: now,
    updatedAt: now
  }
];

const vendors = [
  {
    id: 'ven_sarah_jenkins',
    ownerUserId: 'usr_vendor_demo',
    slug: 'sarah-jenkins',
    displayName: 'Featured Vendor',
    tagline: 'Weddings & Cinematic Portraits',
    city: 'Manama',
    rating: 4.9,
    reviewCount: 124,
    coverImageUrl: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=2000&auto=format&fit=crop',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop',
    styles: ['Cinematic', 'Light & Airy'],
    bio: 'LensWorks professional with 8+ years of experience capturing authentic stories with cinematic direction for weddings, engagements, and family sessions.',
    packages: [
      { id: 'pkg_sarah_ess', name: 'Essential Shoot', price: 150, description: '1 Hour Coverage • 50+ Edited Photos' },
      { id: 'pkg_sarah_pre', name: 'Premium Session', price: 450, description: '3 Hours Coverage • 150+ Edited Photos' },
      { id: 'pkg_sarah_day', name: 'Full Day Cinematic', price: 1200, description: '8 Hours Coverage • Unlimited Edited Photos' }
    ],
    reviews: [
      { id: 'rev_1', rating: 5, author: 'Verified Client', body: 'Amazing energy and stunning finals.', createdAt: '2026-02-14T10:00:00.000Z' },
      { id: 'rev_2', rating: 5, author: 'Emma Williams', body: 'Professional, creative, and fast delivery.', createdAt: '2026-01-22T10:00:00.000Z' }
    ]
  },
  {
    id: 'ven_david_chen',
    ownerUserId: 'usr_vendor_david',
    slug: 'david-chen',
    displayName: 'David Chen',
    tagline: 'Commercial & Ads',
    city: 'Riffa',
    rating: 5.0,
    reviewCount: 89,
    coverImageUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2000&auto=format&fit=crop',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
    styles: ['Commercial', 'Cinematic'],
    bio: 'I am David, a commercial photographer focused on product launches, ad campaigns, and visual branding with clean lighting and polished post-production.',
    packages: [
      { id: 'pkg_david_brand', name: 'Brand Starter', price: 200, description: '2 Hours Coverage • 60+ Edited Photos' },
      { id: 'pkg_david_pro', name: 'Campaign Pro', price: 480, description: '4 Hours Coverage • 180+ Edited Photos' }
    ],
    reviews: [
      { id: 'rev_david_1', rating: 5, author: 'Noah Karim', body: 'Excellent direction and brand framing.', createdAt: '2026-03-12T10:00:00.000Z' }
    ]
  },
  {
    id: 'ven_elena_rostova',
    ownerUserId: 'usr_vendor_elena',
    slug: 'elena-rostova',
    displayName: 'Elena Rostova',
    tagline: 'Portraits & Fashion',
    city: 'Muharraq',
    rating: 4.8,
    reviewCount: 210,
    coverImageUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2000&auto=format&fit=crop',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=300&auto=format&fit=crop',
    styles: ['Light & Airy', 'Editorial'],
    bio: 'I am Elena, blending editorial direction with natural portrait moments to deliver fashion-forward sessions that still feel personal and relaxed.',
    packages: [
      { id: 'pkg_elena_portrait', name: 'Editorial Portrait', price: 120, description: '1 Hour Coverage • 40+ Edited Photos' },
      { id: 'pkg_elena_fashion', name: 'Fashion Session', price: 320, description: '3 Hours Coverage • 120+ Edited Photos' }
    ],
    reviews: [
      { id: 'rev_elena_1', rating: 5, author: 'Layla Stone', body: 'Beautiful compositions and styling guidance.', createdAt: '2026-02-04T10:00:00.000Z' }
    ]
  },
  {
    id: 'ven_studio_7',
    ownerUserId: 'usr_vendor_studio7',
    slug: 'studio-7',
    displayName: 'Studio 7',
    tagline: 'Events & Parties',
    city: 'Manama',
    rating: 4.7,
    reviewCount: 45,
    coverImageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2000&auto=format&fit=crop',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop',
    styles: ['Cinematic', 'Documentary'],
    bio: 'Studio 7 covers events and parties with a documentary-first approach, balancing candid storytelling and key highlight portraits for full gallery coverage.',
    packages: [
      { id: 'pkg_s7_event', name: 'Event Essentials', price: 90, description: '2 Hours Coverage • 70+ Edited Photos' },
      { id: 'pkg_s7_party', name: 'Party Premium', price: 220, description: '5 Hours Coverage • 220+ Edited Photos' }
    ],
    reviews: [
      { id: 'rev_s7_1', rating: 4, author: 'Rami Hasan', body: 'Great turnaround and candid moments.', createdAt: '2026-01-28T10:00:00.000Z' }
    ]
  },
  {
    id: 'ven_marcus_field',
    ownerUserId: 'usr_vendor_marcus',
    slug: 'marcus-field',
    displayName: 'Marcus Field',
    tagline: 'Real Estate & Aerial',
    city: 'Global',
    rating: 4.9,
    reviewCount: 56,
    coverImageUrl: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=2000&auto=format&fit=crop',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
    styles: ['Drone/Aerial', 'Moody'],
    bio: 'I am Marcus, specializing in real-estate and aerial visuals that help listings stand out through architectural framing, drone coverage, and true-to-space editing.',
    packages: [
      { id: 'pkg_marcus_aerial', name: 'Aerial Snapshot', price: 100, description: '1 Hour Coverage • 30+ Edited Photos' },
      { id: 'pkg_marcus_estate', name: 'Property Showcase', price: 275, description: '3 Hours Coverage • 110+ Edited Photos' }
    ],
    reviews: [
      { id: 'rev_marcus_1', rating: 5, author: 'Nora Blake', body: 'Fantastic aerial quality and framing.', createdAt: '2026-03-01T10:00:00.000Z' }
    ]
  }
];

const cartsBySession = new Map();
const bookings = [
  {
    id: 'book_demo_1',
    receiptNumber: 'LW-DEMO01',
    sessionId: 'seed-session',
    customerUserId: 'usr_client_demo',
    vendorUserId: 'usr_vendor_demo',
    customer: {
      firstName: 'Alex',
      lastName: 'Rivera',
      email: 'client@lensworks.app'
    },
    booking: {
      packageName: 'Premium Session',
      total: 577.5,
      deposit: 115.5,
      date: '2026-10-14',
      time: '10:00 AM',
      location: 'Bahrain Bay, Manama',
      duration: '3 Hours'
    },
    status: 'CONFIRMED',
    createdAt: now
  }
];
const payments = [
  {
    id: 'pay_demo_dep_1',
    bookingId: 'book_demo_1',
    payerUserId: 'usr_client_demo',
    recipientUserId: 'usr_vendor_demo',
    amount: 115.5,
    currency: 'USD',
    type: 'DEPOSIT',
    status: 'SUCCEEDED',
    reference: 'TXN-DEMO-DEP-1',
    createdAt: now
  }
];
const forgotRequests = [];
const profileByUserId = {
  usr_client_demo: {
    firstName: 'Alex',
    lastName: 'Rivera',
    studioName: '',
    tagline: 'Client Account',
    location: 'Manama',
    biography: 'Client account used for platform booking previews and checkout testing flows.'
  },
  usr_vendor_demo: {
    firstName: 'Sarah',
    lastName: 'Jenkins',
    studioName: 'SJ Photography',
    tagline: 'Weddings & Cinematic Portraits',
    location: 'Bahrain Bay, Manama',
    biography: 'Hi! I am Sarah, a professional photographer with over 8 years of experience capturing authentic stories with a cinematic style.'
  }
};

const notificationsByUserId = {
  usr_client_demo: {
    bookingRequests: true,
    directMessages: true,
    smsAlerts: false,
    marketingUpdates: true
  },
  usr_vendor_demo: {
    bookingRequests: true,
    directMessages: true,
    smsAlerts: false,
    marketingUpdates: false
  }
};

const accountByUserId = {
  usr_client_demo: {
    phone: '+973 3XXX XXXX',
    socialAccounts: {
      instagram: { connected: false, handle: '' },
      google: { connected: true, handle: 'Connected with Google' }
    }
  },
  usr_vendor_demo: {
    phone: '+973 3XXX XXXX',
    socialAccounts: {
      instagram: { connected: true, handle: '@featured_vendor' },
      google: { connected: false, handle: '' }
    }
  }
};

const conversations = [
  {
    id: 'conv_demo_1',
    participants: ['usr_client_demo', 'usr_vendor_demo'],
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: 'msg_demo_1',
        senderUserId: 'usr_client_demo',
        body: 'Hi Sarah! Just confirming our location for next week.',
        sentAt: '2026-04-01T10:15:00.000Z'
      },
      {
        id: 'msg_demo_2',
        senderUserId: 'usr_vendor_demo',
        body: 'Perfect. Bahrain Bay fountain at 10:00 AM works great.',
        sentAt: '2026-04-01T10:22:00.000Z'
      }
    ]
  }
];

const galleries = [
  {
    id: 'gal_demo_1',
    title: 'Engagement Session - Bahrain Bay',
    ownerUserIds: ['usr_client_demo', 'usr_vendor_demo'],
    assets: [
      {
        id: 'asset_1',
        assetUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop',
        isFavorite: true,
        sortOrder: 1
      },
      {
        id: 'asset_2',
        assetUrl: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=1200&auto=format&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=600&auto=format&fit=crop',
        isFavorite: false,
        sortOrder: 2
      }
    ]
  }
];

export const store = {
  users,
  vendors,
  cartsBySession,
  bookings,
  payments,
  forgotRequests,
  conversations,
  galleries,
  profileByUserId,
  accountByUserId,
  notificationsByUserId,
  promos: {
    LENS20: 0.1
  }
};
