# LensWorks — Photography & Studio Booking Platform

A complete multi-page front-end web application built with HTML, Tailwind CSS, and Lucide Icons.

## Pages & User Flow

| File | Description | Entry Point |
|------|-------------|-------------|
| `index.html` | Landing page — hero, categories, spotlight, how-it-works, footer | **Start here** |
| `login.html` | Split-screen Login / Sign Up with role selector (Client / Vendor) | Nav or CTA |
| `directory.html` | Photographer directory with sticky filters, price slider, style tags | Search / Explore |
| `vendor-profile.html` | Vendor storefront — portfolio lightbox, packages, add-ons, booking widget | From directory |
| `checkout.html` | 3-step secure checkout — date/time, event details, payment, success overlay | From booking widget |
| `client-dashboard.html` | Client portal — upcoming bookings, digital vault, messages | After client login |
| `vendor-dashboard.html` | Vendor studio — analytics, booking manager, packages CRUD, calendar, earnings | After vendor login |
| `account-settings.html` | Profile editor — public profile, account details, security, notifications, billing | From dashboard |
| `gallery.html` | Cinematic digital gallery — masonry grid, favorites, lightbox, download | From client vault |

## Navigation Flow

```
index.html
  ├── directory.html
  │     └── vendor-profile.html
  │           └── checkout.html
  │                 └── client-dashboard.html
  │                       ├── gallery.html
  │                       └── account-settings.html (via dropdown)
  └── login.html
        ├── client-dashboard.html  (role: Client)
        └── vendor-dashboard.html  (role: Vendor)
              └── account-settings.html
```

## Tech Stack

- **Styling:** Tailwind CSS (CDN)
- **Icons:** Lucide Icons (CDN)
- **Images:** Unsplash (no API key required)
- **No build tools required** — open any `.html` file directly in a browser

## How to Run

1. Open `lensworks/index.html` in any modern browser.
2. No server, no npm install, no build step needed.
