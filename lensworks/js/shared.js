/* ===================================================
   LensWorks — Shared JavaScript
   Handles:
     1. Lucide icon initialisation
     2. Mobile nav drawer
     3. Shared localStorage-backed frontend state
   =================================================== */

(function () {
    const KEYS = {
        cart: 'lensworks-cart-v1',
        promo: 'lensworks-promo-v1',
        checkoutDraft: 'lensworks-checkout-draft-v1',
        booking: 'lensworks-last-booking-v1',
        session: 'lensworks-session-v1'
    };

    const API_BASE_URL = window.LENSWORKS_API_BASE_URL ||
        (['localhost', '127.0.0.1'].includes(window.location.hostname)
            ? 'http://localhost:4000/api'
            : '/api');

    function readJSON(key, fallback) {
        try {
            const raw = window.localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    function writeJSON(key, value) {
        window.localStorage.setItem(key, JSON.stringify(value));
    }

    function removeKey(key) {
        window.localStorage.removeItem(key);
    }

    function formatCurrency(value) {
        return `$${Number(value || 0).toFixed(2)}`;
    }

    function createReceiptNumber() {
        const stamp = Date.now().toString(36).slice(-6).toUpperCase();
        return `#LW-${stamp}`;
    }

    function updateCartBadges() {
        const count = Store.getCart().length;
        document.querySelectorAll('#cart-badge, #vp-cart-badge, [data-cart-badge]').forEach((badge) => {
            badge.textContent = count;
            badge.classList.toggle('hidden', count === 0);
        });
    }

    function refreshIcons() {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    const Store = {
        keys: KEYS,
        formatCurrency,
        createReceiptNumber,

        getCart() {
            return readJSON(KEYS.cart, []);
        },

        saveCart(items) {
            writeJSON(KEYS.cart, items);
            updateCartBadges();
            return items;
        },

        addCartItem(item) {
            const items = this.getCart();
            const index = items.findIndex((entry) => entry.id === item.id);

            if (index >= 0) {
                items[index] = item;
            } else {
                items.push(item);
            }

            this.saveCart(items);
            return item;
        },

        removeCartItem(itemId) {
            const next = this.getCart().filter((item) => item.id !== itemId);
            this.saveCart(next);
            return next;
        },

        clearCart() {
            removeKey(KEYS.cart);
            updateCartBadges();
        },

        getPromo() {
            return readJSON(KEYS.promo, null);
        },

        setPromo(promo) {
            writeJSON(KEYS.promo, promo);
        },

        clearPromo() {
            removeKey(KEYS.promo);
        },

        getCheckoutDraft() {
            return readJSON(KEYS.checkoutDraft, null);
        },

        setCheckoutDraft(draft) {
            writeJSON(KEYS.checkoutDraft, draft);
            return draft;
        },

        clearCheckoutDraft() {
            removeKey(KEYS.checkoutDraft);
        },

        getLastBooking() {
            return readJSON(KEYS.booking, null);
        },

        setLastBooking(booking) {
            writeJSON(KEYS.booking, booking);
            return booking;
        },

        getSession() {
            return readJSON(KEYS.session, null);
        },

        setSession(session) {
            writeJSON(KEYS.session, session);
            return session;
        },

        clearSession() {
            removeKey(KEYS.session);
        }
    };

    async function request(path, options = {}) {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            ...options
        });

        const contentType = response.headers.get('content-type') || '';
        const body = contentType.includes('application/json') ? await response.json() : await response.text();

        if (!response.ok) {
            const error = new Error(body?.message || `Request failed: ${response.status}`);
            error.status = response.status;
            error.payload = body;
            throw error;
        }

        return body;
    }

    async function safeRequest(path, options = {}) {
        try {
            const payload = await request(path, options);
            return { ok: true, payload };
        } catch (error) {
            return { ok: false, error };
        }
    }

    const Api = {
        baseUrl: API_BASE_URL,
        request,
        safeRequest,
        auth: {
            register(data) {
                return safeRequest('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
            },
            login(data) {
                return safeRequest('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
            },
            forgotPassword(data) {
                return safeRequest('/auth/forgot-password', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
            },
            logout() {
                return safeRequest('/auth/logout', {
                    method: 'POST'
                });
            },
            me() {
                return safeRequest('/auth/me');
            }
        },
        account: {
            async getSettings() {
                const settings = await safeRequest('/account/settings');
                if (settings.ok) {
                    return settings;
                }

                const [profile, notifications] = await Promise.all([
                    safeRequest('/account/profile'),
                    safeRequest('/account/notifications')
                ]);

                if (!profile.ok && !notifications.ok) {
                    return settings;
                }

                return {
                    ok: true,
                    payload: {
                        success: true,
                        data: {
                            profile: profile.payload?.data?.profile || {},
                            notifications: notifications.payload?.data?.notifications || {},
                            account: {
                                email: '',
                                phone: '',
                                socialAccounts: {
                                    instagram: { connected: false, handle: '' },
                                    google: { connected: false, handle: '' }
                                }
                            }
                        }
                    }
                };
            },
            async updateProfile(data) {
                const primary = await safeRequest('/account/profile', {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
                if (primary.ok) {
                    return primary;
                }

                return safeRequest('/account/profile/update', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
            },
            async updatePassword(data) {
                const primary = await safeRequest('/account/password', {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
                if (primary.ok) {
                    return primary;
                }

                return safeRequest('/account/password/update', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
            },
            async updateNotifications(data) {
                const primary = await safeRequest('/account/notifications', {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
                if (primary.ok) {
                    return primary;
                }

                return safeRequest('/account/notifications/update', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
            },
            updateContact(data) {
                return safeRequest('/account/contact', {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
            },
            updateSocial(data) {
                return safeRequest('/account/social', {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
            }
        },
        vendors: {
            list(params = '') {
                return safeRequest(`/vendors${params}`);
            },
            getBySlug(slug) {
                return safeRequest(`/vendors/${slug}`);
            },
            getReviews(slug) {
                return safeRequest(`/vendors/${slug}/reviews`);
            },
            createReview(slug, data) {
                return safeRequest(`/vendors/${slug}/reviews`, {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
            },
            getPackages(slug) {
                return safeRequest(`/vendors/${slug}/packages`);
            },
            getMyPackages() {
                return safeRequest('/vendors/me/packages');
            },
            createMyPackage(data) {
                return safeRequest('/vendors/me/packages', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
            },
            updateMyPackage(packageId, data) {
                return safeRequest(`/vendors/me/packages/${packageId}`, {
                    method: 'PATCH',
                    body: JSON.stringify(data)
                });
            },
            deleteMyPackage(packageId) {
                return safeRequest(`/vendors/me/packages/${packageId}`, {
                    method: 'DELETE'
                });
            }
        },
        cart: {
            get() {
                return safeRequest('/cart');
            },
            addItem(data) {
                return safeRequest('/cart/items', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
            },
            updateItem(id, data) {
                return safeRequest(`/cart/items/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(data)
                });
            },
            deleteItem(id) {
                return safeRequest(`/cart/items/${id}`, {
                    method: 'DELETE'
                });
            },
            applyPromo(code) {
                return safeRequest('/cart/promo', {
                    method: 'POST',
                    body: JSON.stringify({ code })
                });
            }
        },
        bookings: {
            getMine() {
                return safeRequest('/bookings/me');
            },
            getVendor() {
                return safeRequest('/bookings/vendor');
            },
            cancel(bookingId) {
                return safeRequest(`/bookings/${bookingId}/cancel`, {
                    method: 'PATCH'
                });
            },
            payBalance(bookingId) {
                return safeRequest(`/bookings/${bookingId}/pay-balance`, {
                    method: 'PATCH'
                });
            },
            reschedule(bookingId, data) {
                return safeRequest(`/bookings/${bookingId}/reschedule`, {
                    method: 'PATCH',
                    body: JSON.stringify(data)
                });
            },
            updateVendorStatus(bookingId, status) {
                return safeRequest(`/bookings/${bookingId}/vendor-status`, {
                    method: 'PATCH',
                    body: JSON.stringify({ status })
                });
            }
        },
        payments: {
            listMine() {
                return safeRequest('/payments/me');
            },
            listVendor() {
                return safeRequest('/payments/vendor');
            }
        },
        messages: {
            listConversations() {
                return safeRequest('/messages');
            },
            openConversation(data) {
                return safeRequest('/messages/open', {
                    method: 'POST',
                    body: JSON.stringify(data || {})
                });
            },
            listMessages(conversationId) {
                return safeRequest(`/messages/${conversationId}/messages`);
            },
            send(conversationId, data) {
                return safeRequest(`/messages/${conversationId}/messages`, {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
            }
        },
        galleries: {
            listMine() {
                return safeRequest('/galleries');
            },
            getById(galleryId) {
                return safeRequest(`/galleries/${galleryId}`);
            },
            deliverForBooking(bookingId) {
                return safeRequest('/galleries/deliver', {
                    method: 'POST',
                    body: JSON.stringify({ bookingId })
                });
            }
        },
        checkout: {
            confirm(data) {
                return safeRequest('/checkout/confirm', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
            }
        }
    };

    window.LensWorksStore = Store;
    window.LensWorksApi = Api;
    window.refreshLensWorksIcons = refreshIcons;
    window.updateLensWorksCartBadges = updateCartBadges;
    window.closeMobileNav = function closeMobileNav() {
        const panel = document.getElementById('mobile-nav-panel');
        if (!panel) {
            return;
        }

        panel.classList.add('hidden');
        document.body.style.overflow = '';
    };

    function initMobileNav() {
        const btn = document.getElementById('mobile-menu-btn');
        const panel = document.getElementById('mobile-nav-panel');
        const overlay = document.getElementById('mobile-nav-overlay');
        const close = document.getElementById('mobile-nav-close');

        if (!btn || !panel) return;

        function open() {
            panel.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }

        function shut() {
            window.closeMobileNav();
        }

        btn.addEventListener('click', open);
        if (close) close.addEventListener('click', shut);
        if (overlay) overlay.addEventListener('click', shut);

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && !panel.classList.contains('hidden')) {
                shut();
            }
        });
    }

    function initSharedUI() {
        refreshIcons();
        initMobileNav();
        updateCartBadges();

        const currentPage = String(window.location.pathname || '').toLowerCase();
        const session = Store.getSession();
        const role = String(session?.role || '').toLowerCase();
        const dashboardUrl = role === 'vendor' ? 'vendor-dashboard.html' : 'client-dashboard.html';

        if (session && !currentPage.endsWith('/login.html')) {
            document
                .querySelectorAll('a[href="login.html"]:not([data-logout-link])')
                .forEach((link) => {
                    link.href = dashboardUrl;
                    if (link.textContent.trim().toLowerCase() === 'log in') {
                        link.textContent = 'Dashboard';
                    }
                });

            document.querySelectorAll('button[onclick*="login.html"]').forEach((button) => {
                const label = button.textContent.trim().toLowerCase();
                if (!label.includes('sign up') && !label.includes('get started')) {
                    return;
                }
                button.textContent = 'My Dashboard';
                button.onclick = () => {
                    window.location.href = dashboardUrl;
                };
            });

            document.querySelectorAll('a[href="checkout.html"]').forEach((link) => {
                if (link.textContent.trim().toLowerCase() === 'book now') {
                    link.href = dashboardUrl;
                    link.textContent = 'Open Dashboard';
                }
            });
        }

        document.querySelectorAll('[data-logout-link]').forEach((link) => {
            link.addEventListener('click', async (event) => {
                event.preventDefault();

                if (Api?.auth?.logout) {
                    await Api.auth.logout();
                }

                Store.clearSession();
                Store.clearCheckoutDraft();
                Store.clearPromo();
                Store.clearCart();
                window.location.href = 'login.html';
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSharedUI);
    } else {
        initSharedUI();
    }
})();
