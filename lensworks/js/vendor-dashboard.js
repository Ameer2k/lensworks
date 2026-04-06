document.addEventListener('DOMContentLoaded', () => {
    const pageParams = new URLSearchParams(window.location.search);
    const requestedView = String(pageParams.get('view') || '').trim().toLowerCase();
    const requestedTab = String(pageParams.get('tab') || '').trim().toLowerCase();
    const allowedVendorTabs = new Set(['bookings', 'packages', 'earnings', 'messages', 'analytics', 'reviews']);
    const initialVendorTab = allowedVendorTabs.has(requestedTab) ? requestedTab : 'bookings';
    const initialVendorView = requestedView === 'calendar' ? 'calendar' : 'dashboard';
    const mainNavBtns = Array.from(document.querySelectorAll('.nav-main-btn'));
    const quickTabBtns = Array.from(document.querySelectorAll('.nav-quick-tab-btn'));
    const mainViews = Array.from(document.querySelectorAll('.main-view'));
    const tabs = Array.from(document.querySelectorAll('.tab-btn'));
    const contents = Array.from(document.querySelectorAll('.tab-content'));
    const calendarTrigger = document.querySelector('.nav-calendar-trigger');
    const profileBtn = document.getElementById('profile-menu-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    const notificationButton = document.getElementById('vendor-notification-btn');
    const vendorProfileNameNode = document.getElementById('vendor-profile-name');
    const vendorProfileStudioNode = document.getElementById('vendor-profile-studio');
    const vendorProfileAvatarNode = document.getElementById('vendor-profile-avatar');
    const vendorWelcomeSubtitleNode = document.getElementById('vendor-welcome-subtitle');
    const vendorPublicProfileLink = document.getElementById('vendor-public-profile-link');
    const vendorDropdownPublicProfileLink = document.getElementById('vendor-dropdown-public-profile-link');
    const vendorShareProfileLink = document.getElementById('vendor-share-profile-link');
    const bookingFilter = document.querySelector('#tab-bookings select');
    const bookingListContainer = document.querySelector('#tab-bookings .space-y-4');
    const inquirySearchInput = document.getElementById('vendor-inquiry-search');
    const inquirySidebar = document.querySelector('#tab-messages .w-1\\/3 .flex-1.overflow-y-auto');
    const inquiryHeader = document.querySelector('#tab-messages .flex-1 .px-6.py-5');
    const inquiryMessages = document.querySelector('#tab-messages .flex-1 .flex-1.overflow-y-auto');
    const replyTextarea = document.getElementById('vendor-reply-input');
    const replyButton = document.getElementById('vendor-reply-btn');
    const monthLabelButton = document.getElementById('vendor-calendar-month-btn');
    const calendarButtons = Array.from(document.querySelectorAll('#view-calendar .flex.gap-2 > button'));
    const calendarGrid = document.querySelector('#view-calendar .grid.grid-cols-7.bg-gray-200.gap-px.flex-1');
    const upcomingList = document.querySelector('#view-calendar .bg-white.border.border-gray-200.rounded-2xl.p-6.shadow-sm .space-y-4');
    const addBlockButton = document.getElementById('vendor-add-block-btn');
    const vendorStatEarnings = document.getElementById('vendor-stat-earnings');
    const vendorStatActiveBookings = document.getElementById('vendor-stat-active-bookings');
    const packageGrid = document.querySelector('#tab-packages .grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-6');
    const newPackageButton = Array.from(document.querySelectorAll('#tab-packages button')).find((button) => button.textContent.includes('New Package'));
    const vendorAvailablePayout = document.getElementById('vendor-available-payout');
    const vendorNextTransfer = document.getElementById('vendor-next-transfer');
    const vendorRecentTransactions = document.getElementById('vendor-recent-transactions');
    const vendorBellBadge = document.getElementById('vendor-bell-badge');
    const vendorMessagesTabBadge = document.getElementById('vendor-messages-tab-badge');
    const vendorAnalyticsViews = document.getElementById('vendor-analytics-views');
    const vendorAnalyticsInquiries = document.getElementById('vendor-analytics-inquiries');
    const vendorAnalyticsConversion = document.getElementById('vendor-analytics-conversion');
    const vendorAnalyticsRespTime = document.getElementById('vendor-analytics-resp-time');
    const vendorAnalyticsPackages = document.getElementById('vendor-analytics-packages');
    const vendorAnalyticsProfileComplete = document.getElementById('vendor-analytics-profile-complete');
    const vendorAnalyticsPkgCount = document.getElementById('vendor-analytics-pkg-count');
    const vendorAnalyticsTotalBookings = document.getElementById('vendor-analytics-total-bookings');
    const vendorAnalyticsRepeat = document.getElementById('vendor-analytics-repeat');
    const vendorReviewsSub = document.getElementById('vendor-reviews-sub');
    const vendorReviewsAvg = document.getElementById('vendor-reviews-avg');
    const vendorReviewsStarsDisplay = document.getElementById('vendor-reviews-stars-display');
    const vendorReviewsCount = document.getElementById('vendor-reviews-count');
    const vendorReviewsList = document.getElementById('vendor-reviews-list');
    const vendorCalendarBlocksKey = 'lensworks-vendor-calendar-blocks-v1';

    let inquiries = [];

    let vendorBookings = [];
    let vendorBlockedDays = [];
    let selectedCalendarCell = null;
    let visibleMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    let activeInquiryId = null;
    let isDropdownOpen = false;
    let vendorPackages = [];
    let activeVendorUser = null;
    let activeVendorProfile = null;
    let activeVendorSlug = 'sarah-jenkins';
    const vendorDataFailures = new Map();

    function initialsFromName(name) {
        const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
        if (!parts.length) {
            return 'VP';
        }
        return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
    }

    function avatarFromName(name) {
        const initials = encodeURIComponent(initialsFromName(name));
        return `https://ui-avatars.com/api/?name=${initials}&background=0f172a&color=ffffff&bold=true&size=128`;
    }

    function applyVendorIdentity() {
        const session = window.LensWorksStore?.getSession?.() || {};
        const fullName = String(activeVendorUser?.fullName || session.name || '').trim() || 'LensWorks Vendor';
        const studioName = String(activeVendorProfile?.studioName || activeVendorProfile?.tagline || 'Studio').trim() || 'Studio';

        if (vendorProfileNameNode) {
            vendorProfileNameNode.textContent = fullName;
        }

        if (vendorProfileStudioNode) {
            vendorProfileStudioNode.textContent = studioName;
        }

        if (vendorProfileAvatarNode) {
            vendorProfileAvatarNode.src = avatarFromName(fullName);
            vendorProfileAvatarNode.alt = `${fullName} profile`;
        }

        if (vendorWelcomeSubtitleNode) {
            const firstName = fullName.split(' ')[0] || 'there';
            vendorWelcomeSubtitleNode.textContent = `Welcome back, ${firstName}. Here's how your business is performing.`;
        }

        const profileUrl = `vendor-profile.html?vendor=${encodeURIComponent(activeVendorSlug)}`;
        [vendorPublicProfileLink, vendorDropdownPublicProfileLink, vendorShareProfileLink]
            .filter(Boolean)
            .forEach((link) => {
                link.href = profileUrl;
            });

        if (window.LensWorksStore?.setSession) {
            window.LensWorksStore.setSession({
                ...(session || {}),
                role: 'vendor',
                name: fullName,
                email: activeVendorUser?.email || session.email || ''
            });
        }
    }

    function renderEmptyInquiryState(message = 'No messages yet.') {
        if (inquirySidebar) {
            inquirySidebar.innerHTML = '<div class="p-6 text-sm text-gray-500">No client inquiries yet.</div>';
        }

        if (inquiryHeader) {
            inquiryHeader.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-slate-100 border border-gray-200 flex items-center justify-center">
                        <i data-lucide="message-square" class="w-4 h-4 text-gray-400"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-900 text-sm">No active inquiry</h3>
                        <p class="text-xs text-gray-500 font-medium">New client messages will appear here.</p>
                    </div>
                </div>
            `;
        }

        if (inquiryMessages) {
            inquiryMessages.innerHTML = `<div class="p-6 text-sm text-gray-500">${message}</div>`;
        }

        if (replyButton) {
            replyButton.disabled = true;
            replyButton.classList.add('opacity-60', 'cursor-not-allowed');
        }
        if (replyTextarea) {
            replyTextarea.disabled = true;
            replyTextarea.placeholder = 'Select a client inquiry to reply.';
        }

        window.refreshLensWorksIcons();
    }

    function formatApiTime(value) {
        if (!value) {
            return formatTime();
        }
        return new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }

    function formatMoney(value) {
        return `$${Number(value || 0).toFixed(2)}`;
    }

    function setBadgeValue(element, count) {
        if (!element) {
            return;
        }

        const next = Math.max(0, Number(count || 0));
        element.textContent = String(next);
        element.classList.toggle('hidden', next === 0);
    }

    function updateVendorNotificationBadges() {
        const pendingBookings = vendorBookings.filter((item) => String(item.status || '').toUpperCase() === 'PENDING').length;
        const pendingMessages = Array.isArray(inquiries) ? inquiries.length : 0;
        const total = pendingBookings + pendingMessages;

        setBadgeValue(vendorMessagesTabBadge, pendingMessages);
        setBadgeValue(vendorBellBadge, total);
    }

    function renderVendorDataStatus() {
        const viewDashboard = document.getElementById('view-dashboard');
        if (!viewDashboard) {
            return;
        }

        const existing = document.getElementById('vendor-dashboard-status');
        if (!vendorDataFailures.size) {
            if (existing) {
                existing.remove();
            }
            return;
        }

        const text = Array.from(vendorDataFailures.values()).join(' • ');
        const markup = `
            <div id="vendor-dashboard-status" class="mb-6 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm font-medium">
                Live data is partially unavailable: ${text}
            </div>
        `;

        if (existing) {
            existing.outerHTML = markup;
            return;
        }

        viewDashboard.insertAdjacentHTML('afterbegin', markup);
    }

    function markVendorDataFailure(scope, message) {
        vendorDataFailures.set(scope, message);
        renderVendorDataStatus();
    }

    function clearVendorDataFailure(scope) {
        vendorDataFailures.delete(scope);
        renderVendorDataStatus();
    }

    function formatPaymentType(type) {
        const normalized = String(type || '').toUpperCase();
        if (normalized === 'DEPOSIT') {
            return 'Deposit';
        }
        if (normalized === 'BALANCE') {
            return 'Balance';
        }
        return normalized || 'Payment';
    }

    function getVendorPaymentBookingLabel(payment) {
        const bookingId = String(payment.bookingId || '');
        if (!bookingId) {
            return 'Session Booking';
        }

        const match = vendorBookings.find((entry) => String(entry.id) === bookingId);
        if (match?.packageName) {
            return match.packageName;
        }

        return `Booking ${bookingId}`;
    }

    function renderVendorPaymentHistory(items) {
        if (!vendorRecentTransactions) {
            return;
        }

        const entries = Array.isArray(items) ? items : [];
        const total = entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

        if (vendorAvailablePayout) {
            vendorAvailablePayout.textContent = formatMoney(total);
        }

        if (vendorStatEarnings) {
            vendorStatEarnings.textContent = formatMoney(total);
        }

        if (vendorNextTransfer) {
            if (entries.length) {
                const latest = entries[0].createdAt ? new Date(entries[0].createdAt) : new Date();
                latest.setDate(latest.getDate() + 7);
                vendorNextTransfer.textContent = `Next automatic transfer: ${latest.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}`;
            } else {
                vendorNextTransfer.textContent = 'No scheduled transfer';
            }
        }

        if (!entries.length) {
            vendorRecentTransactions.innerHTML = `
                <div class="p-4 px-6 text-sm text-gray-500">No transactions yet. Payments will appear here once clients pay deposits or balances.</div>
            `;
            window.refreshLensWorksIcons();
            return;
        }

        vendorRecentTransactions.innerHTML = entries.slice(0, 8).map((item) => {
            const createdLabel = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                : 'Pending date';
            const status = String(item.status || 'SUCCEEDED').toUpperCase();
            const statusLabel = status === 'SUCCEEDED' ? 'Completed' : status;

            return `
                <div class="p-4 px-6 flex justify-between items-center hover:bg-gray-50 transition">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center"><i data-lucide="arrow-down-left" class="w-5 h-5"></i></div>
                        <div>
                            <p class="font-semibold text-sm text-slate-900">${formatPaymentType(item.type)} - ${getVendorPaymentBookingLabel(item)}</p>
                            <p class="text-xs text-gray-500">${createdLabel}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-green-600">${formatMoney(item.amount)}</p>
                        <p class="text-[10px] text-gray-400">${statusLabel}</p>
                    </div>
                </div>
            `;
        }).join('');

        window.refreshLensWorksIcons();
    }

    function showConfirmDialog(options = {}) {
        const {
            title = 'Confirm Action',
            message = 'Are you sure?',
            confirmLabel = 'Confirm',
            cancelLabel = 'Cancel'
        } = options;

        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 z-[140] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4';
            overlay.innerHTML = `
                <div class="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
                    <div class="px-5 py-4 border-b border-gray-100">
                        <h3 class="text-base font-bold text-slate-900">${title}</h3>
                    </div>
                    <div class="px-5 py-4">
                        <p class="text-sm text-gray-600">${message}</p>
                    </div>
                    <div class="px-5 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/60">
                        <button type="button" data-action="cancel" class="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-slate-700 hover:bg-white transition">${cancelLabel}</button>
                        <button type="button" data-action="confirm" class="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition">${confirmLabel}</button>
                    </div>
                </div>
            `;

            function close(value) {
                overlay.remove();
                resolve(value);
            }

            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) {
                    close(false);
                }
            });

            overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => close(false));
            overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => close(true));
            document.body.appendChild(overlay);
        });
    }

    function showPackageDialog(initial = null) {
        const editing = Boolean(initial);
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 z-[140] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4';
            overlay.innerHTML = `
                <div class="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
                    <div class="px-5 py-4 border-b border-gray-100">
                        <h3 class="text-base font-bold text-slate-900">${editing ? 'Edit Package' : 'Create Package'}</h3>
                    </div>
                    <form id="vendor-package-form" class="px-5 py-4 space-y-4">
                        <div>
                            <label class="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Package Name</label>
                            <input name="name" type="text" value="${initial?.name || ''}" class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" required>
                        </div>
                        <div>
                            <label class="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Price (USD)</label>
                            <input name="price" type="number" min="1" step="1" value="${Number(initial?.price || 250)}" class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" required>
                        </div>
                        <div>
                            <label class="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Description</label>
                            <textarea name="description" rows="3" class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900">${initial?.description || ''}</textarea>
                        </div>
                        <div class="pt-2 flex justify-end gap-2 border-t border-gray-100">
                            <button type="button" data-action="cancel" class="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-slate-700 hover:bg-gray-50 transition">Cancel</button>
                            <button type="submit" class="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition">${editing ? 'Save Changes' : 'Create Package'}</button>
                        </div>
                    </form>
                </div>
            `;

            function close(value) {
                overlay.remove();
                resolve(value);
            }

            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) {
                    close(null);
                }
            });

            const form = overlay.querySelector('#vendor-package-form');
            overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => close(null));
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const data = new FormData(form);
                const payload = {
                    name: String(data.get('name') || '').trim(),
                    price: Number(data.get('price') || 0),
                    description: String(data.get('description') || '').trim()
                };

                if (!payload.name || !Number.isFinite(payload.price) || payload.price <= 0) {
                    return;
                }

                close(payload);
            });

            document.body.appendChild(overlay);
        });
    }

    function showTextInputDialog(options = {}) {
        const {
            title = 'Input Required',
            label = 'Value',
            placeholder = '',
            initialValue = '',
            submitLabel = 'Save'
        } = options;

        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 z-[140] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4';
            overlay.innerHTML = `
                <div class="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
                    <div class="px-5 py-4 border-b border-gray-100">
                        <h3 class="text-base font-bold text-slate-900">${title}</h3>
                    </div>
                    <form id="text-input-dialog-form" class="px-5 py-4 space-y-4">
                        <div>
                            <label class="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">${label}</label>
                            <input name="value" type="text" value="${initialValue}" placeholder="${placeholder}" class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" required>
                        </div>
                        <div class="pt-2 flex justify-end gap-2 border-t border-gray-100">
                            <button type="button" data-action="cancel" class="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-slate-700 hover:bg-gray-50 transition">Cancel</button>
                            <button type="submit" class="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition">${submitLabel}</button>
                        </div>
                    </form>
                </div>
            `;

            function close(value) {
                overlay.remove();
                resolve(value);
            }

            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) {
                    close(null);
                }
            });

            const form = overlay.querySelector('#text-input-dialog-form');
            overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => close(null));
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const data = new FormData(form);
                const value = String(data.get('value') || '').trim();
                if (!value) {
                    return;
                }
                close(value);
            });

            document.body.appendChild(overlay);
        });
    }

    function toIsoDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function readBlockedDays() {
        try {
            const raw = window.localStorage.getItem(vendorCalendarBlocksKey);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function saveBlockedDays(items) {
        vendorBlockedDays = items;
        window.localStorage.setItem(vendorCalendarBlocksKey, JSON.stringify(items));
    }

    function normalizeBookingStatus(status) {
        const normalized = String(status || '').toUpperCase();
        if (normalized.includes('BLOCK')) {
            return 'blocked';
        }
        if (normalized.includes('DELIVERED') || normalized.includes('COMPLETE')) {
            return 'completed';
        }
        if (normalized.includes('PENDING') || normalized.includes('AWAIT')) {
            return 'pending';
        }
        if (normalized.includes('CONFIRM')) {
            return 'confirmed';
        }
        return 'other';
    }

    function parseBookingDate(value) {
        if (!value) {
            return null;
        }

        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function getCalendarEventStyle(status) {
        const normalized = normalizeBookingStatus(status);
        if (normalized === 'blocked') {
            return {
                dotClass: 'bg-gray-400',
                cardClass: 'bg-gray-200 text-gray-700 border border-gray-300',
                titleClass: 'text-gray-600'
            };
        }

        if (normalized === 'confirmed') {
            return {
                dotClass: 'bg-blue-500',
                cardClass: 'bg-blue-100 text-blue-800 border border-blue-200',
                titleClass: 'text-blue-600'
            };
        }

        if (normalized === 'pending') {
            return {
                dotClass: 'bg-yellow-500',
                cardClass: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
                titleClass: 'text-yellow-700'
            };
        }

        if (normalized === 'completed') {
            return {
                dotClass: 'bg-gray-400',
                cardClass: 'bg-gray-200 text-gray-700 border border-gray-300',
                titleClass: 'text-gray-600'
            };
        }

        return {
            dotClass: 'bg-slate-500',
            cardClass: 'bg-slate-100 text-slate-700 border border-slate-200',
            titleClass: 'text-slate-600'
        };
    }

    function formatCalendarMonthLabel(date) {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    function getBookingsForVisibleMonth() {
        const bookedEntries = vendorBookings
            .map((entry) => ({
                ...entry,
                parsedDate: parseBookingDate(entry.date)
            }));

        const blockEntries = vendorBlockedDays.map((entry) => ({
            ...entry,
            status: 'BLOCKED',
            packageName: entry.packageName || 'Blocked',
            time: entry.time || 'All Day',
            customer: entry.customer || 'Unavailable',
            parsedDate: parseBookingDate(entry.date)
        }));

        return [...bookedEntries, ...blockEntries]
            .filter((entry) => {
                if (!entry.parsedDate) {
                    return false;
                }

                return (
                    entry.parsedDate.getFullYear() === visibleMonthStart.getFullYear()
                    && entry.parsedDate.getMonth() === visibleMonthStart.getMonth()
                );
            })
            .sort((a, b) => {
                const dateDiff = a.parsedDate.getTime() - b.parsedDate.getTime();
                if (dateDiff !== 0) {
                    return dateDiff;
                }

                const aBlocked = normalizeBookingStatus(a.status) === 'blocked';
                const bBlocked = normalizeBookingStatus(b.status) === 'blocked';
                if (aBlocked === bBlocked) {
                    return 0;
                }

                return aBlocked ? 1 : -1;
            });
    }

    function getSelectedDateKey() {
        if (!Number.isFinite(selectedCalendarCell)) {
            return null;
        }

        const selectedDate = new Date(
            visibleMonthStart.getFullYear(),
            visibleMonthStart.getMonth(),
            selectedCalendarCell
        );

        return toIsoDate(selectedDate);
    }

    function getBlockedDayByDate(dateKey) {
        if (!dateKey) {
            return null;
        }

        return vendorBlockedDays.find((entry) => entry.date === dateKey) || null;
    }

    function removeCalendarBlockById(blockId) {
        const next = vendorBlockedDays.filter((entry) => entry.id !== blockId);
        saveBlockedDays(next);
        updateCalendarMonth();
    }

    function updateBlockActionButton() {
        if (!addBlockButton) {
            return;
        }

        const selectedDateKey = getSelectedDateKey();
        const selectedBlock = getBlockedDayByDate(selectedDateKey);

        if (!selectedDateKey) {
            addBlockButton.classList.remove('bg-red-600', 'hover:bg-red-700');
            addBlockButton.classList.add('bg-slate-900', 'hover:bg-slate-800');
            addBlockButton.innerHTML = '<i data-lucide="plus" class="w-5 h-5"></i> Add Block / Event';
            window.refreshLensWorksIcons();
            return;
        }

        if (selectedBlock) {
            addBlockButton.classList.remove('bg-slate-900', 'hover:bg-slate-800');
            addBlockButton.classList.add('bg-red-600', 'hover:bg-red-700');
            addBlockButton.innerHTML = '<i data-lucide="trash-2" class="w-5 h-5"></i> Remove Block';
            window.refreshLensWorksIcons();
            return;
        }

        addBlockButton.classList.remove('bg-red-600', 'hover:bg-red-700');
        addBlockButton.classList.add('bg-slate-900', 'hover:bg-slate-800');
        addBlockButton.innerHTML = '<i data-lucide="plus" class="w-5 h-5"></i> Add Block / Event';
        window.refreshLensWorksIcons();
    }

    function statusPill(status) {
        const normalized = normalizeBookingStatus(status);
        if (normalized === 'blocked') {
            return '<span class="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Blocked</span>';
        }
        if (String(status || '').toUpperCase() === 'CANCELED') {
            return '<span class="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Canceled</span>';
        }
        if (normalized === 'confirmed') {
            return '<span class="bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Confirmed</span>';
        }
        if (normalized === 'pending') {
            return '<span class="bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Pending Deposit</span>';
        }
        if (normalized === 'completed') {
            return '<span class="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Completed</span>';
        }
        return '<span class="bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Status</span>';
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function updateVendorStats(items) {
        if (!Array.isArray(items) || !items.length) {
            return;
        }

        if (vendorStatEarnings) {
            const earnings = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
            vendorStatEarnings.textContent = formatMoney(earnings);
        }

        if (vendorStatActiveBookings) {
            const active = items.filter((item) => {
                const status = String(item.status || '').toUpperCase();
                return status !== 'COMPLETED' && status !== 'CANCELED';
            }).length;
            vendorStatActiveBookings.textContent = String(active);
        }
    }

    function bookingActionButtons(item) {
        const status = String(item.status || '').toUpperCase();

        if (status === 'PENDING') {
            return `
                <button data-booking-action="confirm" data-booking-id="${item.id}" class="flex-1 md:flex-none bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition shadow-sm">
                    Approve
                </button>
                <button data-booking-action="cancel" data-booking-id="${item.id}" class="flex-1 md:flex-none border border-red-200 text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-semibold transition">
                    Decline
                </button>
            `;
        }

        if (status === 'CONFIRMED') {
            return `
                <button data-booking-action="complete" data-booking-id="${item.id}" class="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm">
                    Mark Complete
                </button>
            `;
        }

        if (status === 'COMPLETED') {
            if (item.galleryId) {
                return `
                    <button data-booking-action="open-gallery" data-booking-id="${item.id}" data-gallery-id="${item.galleryId}" class="flex-1 md:flex-none bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition shadow-sm">
                        Open Gallery
                    </button>
                `;
            }

            return `
                <button data-booking-action="deliver-gallery" data-booking-id="${item.id}" class="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm">
                    Deliver Gallery
                </button>
            `;
        }

        if (status === 'CANCELED') {
            return `
                <button class="flex-1 md:flex-none bg-red-50 text-red-500 px-4 py-2 rounded-lg text-sm font-semibold cursor-default" disabled>
                    Canceled
                </button>
            `;
        }

        return `
            <button class="flex-1 md:flex-none border border-gray-200 text-slate-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2">
                <i data-lucide="message-square" class="w-4 h-4"></i> Chat
            </button>
        `;
    }

    function decisionAuditText(item) {
        const status = String(item.vendorDecision || item.status || '').toUpperCase();
        const rawTime = item.vendorDecisionAt || item.updatedAt || item.createdAt;
        if (!status || !rawTime) {
            return '';
        }

        const timestamp = new Date(rawTime);
        const formatted = Number.isNaN(timestamp.getTime())
            ? ''
            : timestamp.toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                hour: 'numeric',
                minute: '2-digit'
            });

        if (!formatted) {
            return '';
        }

        if (status === 'CONFIRMED') {
            return `Approved ${formatted}`;
        }

        if (status === 'CANCELED') {
            return `Declined ${formatted}`;
        }

        if (status === 'COMPLETED') {
            return `Completed ${formatted}`;
        }

        return '';
    }

    function switchMainView(targetViewId, activeBtnId) {
        mainNavBtns.forEach((button) => {
            const active = button.id === activeBtnId;
            button.classList.toggle('text-slate-900', active);
            button.classList.toggle('font-semibold', active);
            button.classList.toggle('text-gray-500', !active);
        });

        mainViews.forEach((view) => {
            const active = view.id === targetViewId;
            view.classList.toggle('hidden', !active);
            view.classList.toggle('block', active);
            view.classList.toggle('opacity-0', !active);
            view.classList.toggle('opacity-100', active);
        });

        const params = new URLSearchParams(window.location.search);
        params.set('view', targetViewId === 'view-calendar' ? 'calendar' : 'dashboard');
        const next = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState(null, '', next);
    }

    function setActiveTab(targetKey) {
        tabs.forEach((tab) => {
            const active = tab.dataset.target === targetKey;
            tab.classList.toggle('text-slate-900', active);
            tab.classList.toggle('border-slate-900', active);
            tab.classList.toggle('font-bold', active);
            tab.classList.toggle('text-gray-500', !active);
            tab.classList.toggle('border-transparent', !active);
            tab.classList.toggle('font-medium', !active);
        });

        contents.forEach((content) => {
            const active = content.id === `tab-${targetKey}`;
            content.classList.toggle('hidden', !active);
            content.classList.toggle('block', active);
            content.classList.toggle('opacity-0', !active);
            content.classList.toggle('opacity-100', active);
        });

        const params = new URLSearchParams(window.location.search);
        params.set('tab', targetKey);
        const next = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState(null, '', next);
    }

    function closeDropdown() {
        if (!profileDropdown) {
            return;
        }

        profileDropdown.classList.remove('opacity-100', 'scale-100');
        profileDropdown.classList.add('opacity-0', 'scale-95');
        setTimeout(() => profileDropdown.classList.add('hidden'), 150);
        isDropdownOpen = false;
    }

    function formatTime() {
        return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }

    function renderInquiryList(filterValue = '') {
        if (!inquirySidebar) {
            return;
        }

        const query = filterValue.trim().toLowerCase();
        const visibleInquiries = inquiries.filter((inquiry) => {
            return !query || inquiry.name.toLowerCase().includes(query) || inquiry.preview.toLowerCase().includes(query);
        });

        inquirySidebar.innerHTML = '';

        if (!visibleInquiries.length) {
            inquirySidebar.innerHTML = '<div class="p-6 text-sm text-gray-500">No clients match that search.</div>';
            return;
        }

        visibleInquiries.forEach((inquiry) => {
            const active = inquiry.id === activeInquiryId;
            const item = document.createElement('button');
            item.type = 'button';
            item.className = `w-full text-left p-4 border-b border-gray-100 flex gap-4 relative transition ${active ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`;
            item.innerHTML = `
                ${active ? '<div class="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-md"></div>' : ''}
                <div class="relative">
                    <img src="${inquiry.avatar}" class="w-12 h-12 rounded-full object-cover shadow-sm" alt="${inquiry.name}">
                </div>
                <div class="flex-1 overflow-hidden pt-1">
                    <div class="flex justify-between items-center mb-1">
                        <h4 class="font-bold text-sm text-slate-900">${inquiry.name}</h4>
                        <span class="text-[10px] ${active ? 'text-blue-600 font-bold' : 'text-gray-400'} uppercase">${inquiry.timeLabel}</span>
                    </div>
                    <p class="text-sm ${active ? 'text-gray-600 font-medium' : 'text-gray-500'} truncate">${inquiry.preview}</p>
                </div>
            `;
            item.addEventListener('click', () => {
                activeInquiryId = inquiry.id;
                renderInquiryList(inquirySearchInput ? inquirySearchInput.value : '');
                renderInquiryThread();
            });
            inquirySidebar.appendChild(item);
        });
    }

    function renderInquiryThread() {
        const inquiry = inquiries.find((entry) => entry.id === activeInquiryId);
        if (!inquiry || !inquiryHeader || !inquiryMessages) {
            return;
        }

        inquiryHeader.innerHTML = `
            <div class="flex items-center gap-4">
                <img src="${inquiry.avatar}" class="w-10 h-10 rounded-full object-cover border border-gray-100" alt="${inquiry.name}">
                <div>
                    <h3 class="font-bold text-slate-900 text-sm">${inquiry.name}</h3>
                    <p class="text-xs text-blue-600 font-medium">${inquiry.subtitle}</p>
                </div>
            </div>
        `;

        inquiryMessages.innerHTML = '';
        inquiry.messages.forEach((message) => {
            const wrapper = document.createElement('div');
            wrapper.className = message.direction === 'incoming' ? 'flex justify-start' : 'flex justify-end';
            wrapper.innerHTML = message.direction === 'incoming'
                ? `
                    <div class="flex gap-3 max-w-[75%]">
                        <img src="${inquiry.avatar}" class="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1" alt="${inquiry.name}">
                        <div>
                            <div class="bg-white border border-gray-200 text-slate-900 rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm">
                                <p class="text-sm leading-relaxed">${message.body}</p>
                            </div>
                            <span class="text-[10px] text-gray-400 mt-1 block font-medium">${message.time}</span>
                        </div>
                    </div>
                `
                : `
                    <div class="max-w-[70%]">
                        <div class="bg-slate-900 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-sm">
                            <p class="text-sm leading-relaxed">${message.body}</p>
                        </div>
                        <span class="text-[10px] text-gray-400 mt-1 block text-right font-medium">${message.time}</span>
                    </div>
                `;
            inquiryMessages.appendChild(wrapper);
        });

        inquiryMessages.scrollTop = inquiryMessages.scrollHeight;
        if (replyButton) {
            replyButton.disabled = false;
            replyButton.classList.remove('opacity-60', 'cursor-not-allowed');
        }
        if (replyTextarea) {
            replyTextarea.disabled = false;
            replyTextarea.placeholder = 'Write a reply...';
        }
        window.refreshLensWorksIcons();
    }

    async function hydrateVendorIdentityFromApi() {
        if (window.LensWorksApi?.auth?.me) {
            const meResult = await window.LensWorksApi.auth.me();
            if (!meResult.ok) {
                window.location.replace('login.html');
                return;
            }
            activeVendorUser = meResult.payload?.data?.user || null;
            const role = String(activeVendorUser?.role || '').toUpperCase();
            if (role && role !== 'VENDOR') {
                window.location.replace('client-dashboard.html');
                return;
            }
        }

        if (window.LensWorksApi?.account?.getSettings) {
            const settingsResult = await window.LensWorksApi.account.getSettings();
            if (settingsResult.ok) {
                activeVendorProfile = settingsResult.payload?.data?.profile || null;
            }
        }

        if (window.LensWorksApi?.vendors?.getMyPackages) {
            const packagesResult = await window.LensWorksApi.vendors.getMyPackages();
            if (packagesResult.ok) {
                const vendorInfo = packagesResult.payload?.data?.vendor || {};
                activeVendorSlug = vendorInfo.slug || activeVendorSlug;

                renderVendorAnalytics();
                hydrateVendorReviewsFromApi();
            }
        }

        applyVendorIdentity();
    }

    function filterBookings() {
        if (!bookingFilter) {
            return;
        }

        const selected = bookingFilter.value.toLowerCase();
        const bookingCards = Array.from(document.querySelectorAll('#tab-bookings .space-y-4 > div'));
        bookingCards.forEach((card) => {
            const status = card.dataset.status || normalizeBookingStatus(card.textContent);
            const visible =
                selected === 'all statuses'
                || (selected === 'confirmed' && status === 'confirmed')
                || (selected === 'pending deposit' && status === 'pending')
                || (selected === 'completed' && status === 'completed');
            card.classList.toggle('hidden', !visible);
        });
    }

    function renderVendorBookings(items) {
        if (!bookingListContainer) {
            return;
        }

        if (!Array.isArray(items) || !items.length) {
            bookingListContainer.innerHTML = `
                <div class="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-sm text-gray-500">
                    No bookings yet. New requests will appear here as soon as clients submit them.
                </div>
            `;
            window.refreshLensWorksIcons();
            return;
        }

        bookingListContainer.innerHTML = items.map((item) => {
            const rawDate = item.date ? new Date(item.date) : null;
            const month = rawDate ? rawDate.toLocaleDateString('en-US', { month: 'short' }) : 'TBD';
            const day = rawDate ? rawDate.toLocaleDateString('en-US', { day: '2-digit' }) : '--';
            const status = normalizeBookingStatus(item.status);
            const hasRescheduleReason = status === 'pending' && String(item.rescheduleReason || '').trim();
            const decisionText = decisionAuditText(item);
            return `
                <div data-status="${status}" class="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition">
                    <div class="flex items-center gap-6">
                        <div class="w-16 h-16 bg-slate-50 border border-slate-100 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                            <span class="text-xs font-bold text-red-500 uppercase">${month}</span>
                            <span class="text-xl font-black text-slate-900 leading-none mt-0.5">${day}</span>
                        </div>
                        <div>
                            <div class="flex items-center gap-3 mb-1">
                                <h3 class="font-bold text-slate-900 text-lg">${item.packageName || 'Booked Session'}</h3>
                                ${statusPill(item.status)}
                                ${hasRescheduleReason ? '<span class="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Reschedule Request</span>' : ''}
                            </div>
                            <div class="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-gray-500">
                                <span class="flex items-center gap-1.5"><i data-lucide="user" class="w-3.5 h-3.5"></i> Client: ${item.customer || 'Client'}</span>
                                <span class="flex items-center gap-1.5"><i data-lucide="map-pin" class="w-3.5 h-3.5"></i> ${item.location || 'Location pending'}</span>
                                <span class="flex items-center gap-1.5"><i data-lucide="clock" class="w-3.5 h-3.5"></i> ${item.time || 'Time pending'}${item.duration ? ` (${item.duration})` : ''}</span>
                            </div>
                            ${hasRescheduleReason ? `<p class="text-xs text-indigo-700 mt-2"><span class="font-semibold">Reason:</span> ${escapeHtml(item.rescheduleReason)}</p>` : ''}
                            ${decisionText ? `<p class="text-xs text-gray-500 mt-1"><span class="font-semibold">Decision:</span> ${decisionText}</p>` : ''}
                        </div>
                    </div>
                    <div class="flex items-center gap-3 w-full md:w-auto">
                        <div class="text-right hidden lg:block mr-4">
                            <p class="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Payout</p>
                            <p class="font-bold text-slate-900">$${Number(item.total || 0).toFixed(2)}</p>
                        </div>
                        ${bookingActionButtons(item)}
                    </div>
                </div>
            `;
        }).join('');

        window.refreshLensWorksIcons();
        updateVendorNotificationBadges();
    }

    function buildVendorNotifications() {
        const entries = [];
        const pendingCount = vendorBookings.filter((item) => String(item.status || '').toUpperCase() === 'PENDING').length;
        const completedWithoutGallery = vendorBookings.filter((item) => {
            const status = String(item.status || '').toUpperCase();
            return status === 'COMPLETED' && !item.galleryId;
        }).length;

        if (pendingCount > 0) {
            entries.push({
                title: 'Pending booking requests',
                body: `${pendingCount} request${pendingCount === 1 ? '' : 's'} waiting for your approval.`,
                actionLabel: 'Open Bookings',
                action: () => setActiveTab('bookings')
            });
        }

        if (completedWithoutGallery > 0) {
            entries.push({
                title: 'Galleries to deliver',
                body: `${completedWithoutGallery} completed booking${completedWithoutGallery === 1 ? '' : 's'} still need gallery delivery.`,
                actionLabel: 'Review Bookings',
                action: () => setActiveTab('bookings')
            });
        }

        entries.push({
            title: 'Payout updates',
            body: 'Check your latest transactions in Earnings & Payouts.',
            actionLabel: 'Open Earnings',
            action: () => setActiveTab('earnings')
        });

        return entries;
    }

    function showNotificationPanel(title, items) {
        const notifications = Array.isArray(items) ? items : [];
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 z-[145] bg-black/35 backdrop-blur-sm flex items-start justify-center p-4 pt-24';
        overlay.innerHTML = `
            <div class="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
                <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 class="text-base font-bold text-slate-900">${title}</h3>
                    <button type="button" data-close="notifications" class="p-1.5 rounded-md text-gray-400 hover:text-slate-900 hover:bg-gray-100 transition">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="p-4 space-y-3 max-h-[60vh] overflow-y-auto" id="vendor-notifications-list"></div>
            </div>
        `;

        const list = overlay.querySelector('#vendor-notifications-list');
        notifications.forEach((entry) => {
            const row = document.createElement('div');
            row.className = 'rounded-xl border border-gray-200 p-4 bg-gray-50/60';
            row.innerHTML = `
                <p class="text-sm font-bold text-slate-900">${entry.title}</p>
                <p class="text-xs text-gray-600 mt-1">${entry.body}</p>
                <div class="mt-3">
                    <button type="button" class="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition">${entry.actionLabel || 'Open'}</button>
                </div>
            `;

            row.querySelector('button').addEventListener('click', () => {
                overlay.remove();
                if (typeof entry.action === 'function') {
                    entry.action();
                }
            });

            list.appendChild(row);
        });

        function closePanel() {
            overlay.remove();
        }

        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                closePanel();
            }
        });

        overlay.querySelector('[data-close="notifications"]').addEventListener('click', closePanel);
        document.body.appendChild(overlay);
        window.refreshLensWorksIcons();
    }

    function renderVendorPackages(items) {
        if (!packageGrid || !Array.isArray(items)) {
            return;
        }

        if (!items.length) {
            packageGrid.innerHTML = `
                <div class="md:col-span-2 lg:col-span-3 bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-sm text-gray-500">
                    No packages yet. Create your first package to start receiving bookings.
                </div>
            `;
            return;
        }

        packageGrid.innerHTML = items.map((pkg, index) => {
            const popular = index === 0;
            return `
                <div class="${popular ? 'bg-slate-50 border-2 border-slate-900' : 'bg-white border border-gray-200'} rounded-2xl p-6 shadow-sm flex flex-col relative group">
                    ${popular ? '<div class="absolute -top-3 left-6 bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Featured</div>' : ''}
                    <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button type="button" data-package-action="edit" data-package-id="${pkg.id}" class="p-1.5 ${popular ? 'bg-white border border-gray-200' : 'bg-gray-100'} text-gray-600 rounded-md hover:bg-gray-200">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                        <button type="button" data-package-action="delete" data-package-id="${pkg.id}" class="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100">
                            <i data-lucide="trash" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <h3 class="font-bold text-xl text-slate-900 mb-1 ${popular ? 'mt-2' : ''}">${pkg.name || 'Package'}</h3>
                    <p class="text-2xl font-black text-slate-900 mb-4">$${Number(pkg.price || 0).toLocaleString()}</p>
                    <p class="text-sm text-gray-500 mb-6">${pkg.description || 'No description provided.'}</p>
                    <div class="space-y-3 mt-auto border-t ${popular ? 'border-gray-200' : 'border-gray-100'} pt-4">
                        <div class="flex items-center gap-2 text-sm text-gray-700">
                            <i data-lucide="camera" class="w-4 h-4 text-blue-500"></i> Live package from vendor API
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        window.refreshLensWorksIcons();
    }

    async function hydrateVendorPackagesFromApi() {
        if (!window.LensWorksApi?.vendors?.getMyPackages) {
            return;
        }

        const result = await window.LensWorksApi.vendors.getMyPackages();
        if (!result.ok) {
            return;
        }

        vendorPackages = result.payload?.data?.packages || [];
        renderVendorPackages(vendorPackages);
        vendorPackages = result.payload?.data?.packages || [];
        renderVendorPackages(vendorPackages);
        renderVendorAnalytics();
    }

    function renderVendorAnalytics() {
        const totalBookings = vendorBookings.length;
        const inquiryCount = inquiries.length;
        const conversion = inquiryCount > 0 ? Math.round((totalBookings / inquiryCount) * 100) : (totalBookings ? 100 : 0);
        const profileCompleteness = (() => {
            let score = 0;
            if (activeVendorProfile?.firstName) score += 20;
            if (activeVendorProfile?.lastName) score += 20;
            if (activeVendorProfile?.studioName) score += 20;
            if (activeVendorProfile?.location) score += 20;
            if (String(activeVendorProfile?.biography || '').trim().length >= 40) score += 20;
            return score;
        })();

        if (vendorAnalyticsViews) {
            const base = Math.max(120, totalBookings * 65 + vendorPackages.length * 40 + inquiries.length * 20);
            vendorAnalyticsViews.textContent = String(base);
        }
        if (vendorAnalyticsInquiries) {
            vendorAnalyticsInquiries.textContent = String(inquiryCount);
        }
        if (vendorAnalyticsConversion) {
            vendorAnalyticsConversion.textContent = `${conversion}%`;
        }
        if (vendorAnalyticsRespTime) {
            const hours = inquiryCount > 0 ? Math.max(1, Math.round((48 / inquiryCount) * 10) / 10) : 0;
            vendorAnalyticsRespTime.textContent = inquiryCount ? `${hours}h` : '—';
        }

        if (vendorAnalyticsProfileComplete) {
            vendorAnalyticsProfileComplete.textContent = `${profileCompleteness}%`;
        }
        if (vendorAnalyticsPkgCount) {
            vendorAnalyticsPkgCount.textContent = String(vendorPackages.length);
        }
        if (vendorAnalyticsTotalBookings) {
            vendorAnalyticsTotalBookings.textContent = String(totalBookings);
        }
        if (vendorAnalyticsRepeat) {
            const customers = new Map();
            vendorBookings.forEach((entry) => {
                const key = String(entry.customer || '').trim().toLowerCase();
                if (!key) return;
                customers.set(key, (customers.get(key) || 0) + 1);
            });
            const repeats = Array.from(customers.values()).filter((count) => count > 1).length;
            vendorAnalyticsRepeat.textContent = String(repeats);
        }

        if (vendorAnalyticsPackages) {
            if (!vendorPackages.length) {
                vendorAnalyticsPackages.innerHTML = '<div class="text-sm text-gray-500">No package data yet.</div>';
            } else {
                const bookingCounts = new Map();
                vendorBookings.forEach((entry) => {
                    const key = String(entry.packageName || '').trim();
                    if (!key) return;
                    bookingCounts.set(key, (bookingCounts.get(key) || 0) + 1);
                });

                vendorAnalyticsPackages.innerHTML = vendorPackages.map((pkg) => {
                    const count = bookingCounts.get(pkg.name) || 0;
                    const width = Math.min(100, 15 + (count * 18));
                    return `
                        <div>
                            <div class="flex justify-between items-center mb-1 text-sm">
                                <span class="font-semibold text-slate-900">${pkg.name}</span>
                                <span class="text-gray-500">${count} bookings</span>
                            </div>
                            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div class="h-full bg-blue-500 rounded-full" style="width: ${width}%"></div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    async function hydrateVendorReviewsFromApi() {
        if (!vendorReviewsList) {
            return;
        }
        if (!activeVendorSlug || !window.LensWorksApi?.vendors?.getReviews) {
            vendorReviewsList.innerHTML = '<div class="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-sm text-gray-500">Reviews are unavailable right now.</div>';
            return;
        }

        const result = await window.LensWorksApi.vendors.getReviews(activeVendorSlug);
        if (!result.ok) {
            vendorReviewsList.innerHTML = '<div class="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-sm text-gray-500">Could not load reviews.</div>';
            if (vendorReviewsSub) {
                vendorReviewsSub.textContent = 'Could not load reviews for this profile.';
            }
            return;
        }

        const reviews = result.payload?.data?.reviews || [];
        if (!reviews.length) {
            if (vendorReviewsAvg) vendorReviewsAvg.textContent = '0.0';
            if (vendorReviewsStarsDisplay) vendorReviewsStarsDisplay.textContent = '☆☆☆☆☆';
            if (vendorReviewsCount) vendorReviewsCount.textContent = '0 reviews';
            vendorReviewsList.innerHTML = '<div class="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-sm text-gray-500">No reviews yet. Complete bookings and ask clients for feedback.</div>';
            return;
        }

        const avg = reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length;
        if (vendorReviewsAvg) vendorReviewsAvg.textContent = avg.toFixed(1);
        const rounded = Math.round(avg);
        if (vendorReviewsStarsDisplay) vendorReviewsStarsDisplay.textContent = `${'★'.repeat(rounded)}${'☆'.repeat(5 - rounded)}`;
        if (vendorReviewsCount) vendorReviewsCount.textContent = `${reviews.length} review${reviews.length === 1 ? '' : 's'}`;
        if (vendorReviewsSub) vendorReviewsSub.textContent = `Showing latest feedback for ${activeVendorSlug.replace('-', ' ')}.`;

        vendorReviewsList.innerHTML = reviews
            .slice()
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
            .map((review) => {
                const stars = `${'★'.repeat(Number(review.rating || 0))}${'☆'.repeat(5 - Number(review.rating || 0))}`;
                const date = review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : 'Recently';
                return `
                    <article class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                            <div>
                                <p class="font-bold text-slate-900">${review.author || 'Verified Client'}</p>
                                <p class="text-xs text-gray-400">${date}</p>
                            </div>
                            <div class="text-yellow-400 text-lg leading-none" aria-label="${review.rating || 0} out of 5 stars">${stars}</div>
                        </div>
                        <p class="text-sm text-gray-700 leading-relaxed">${review.body || ''}</p>
                    </article>
                `;
            }).join('');
    }

    function renderUpcomingCalendarList(monthBookings) {
        if (!upcomingList) {
            return;
        }

        if (!monthBookings.length) {
            upcomingList.innerHTML = `
                <div class="flex gap-3 p-2 -mx-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/60">
                    <div class="w-2.5 h-2.5 rounded-full bg-gray-300 mt-1 flex-shrink-0"></div>
                    <div>
                        <p class="text-sm font-bold text-slate-700">No scheduled shoots</p>
                        <p class="text-xs text-gray-500 mt-0.5">This month is currently open for new bookings.</p>
                    </div>
                </div>
            `;
            return;
        }

        upcomingList.innerHTML = monthBookings.map((entry) => {
            const style = getCalendarEventStyle(entry.status);
            const dateLabel = entry.parsedDate
                ? entry.parsedDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
                : 'TBD';
            const isBlocked = normalizeBookingStatus(entry.status) === 'blocked';
            const subtitle = isBlocked
                ? entry.packageName || 'Blocked'
                : `${entry.time || 'Time pending'} • ${entry.customer || 'Client'}`;

            return `
                <div class="flex gap-3 hover:bg-gray-50 p-2 -mx-2 rounded-lg transition cursor-pointer">
                    <div class="w-2.5 h-2.5 rounded-full ${style.dotClass} mt-1 flex-shrink-0"></div>
                    <div class="flex-1">
                        <p class="text-sm font-bold text-slate-900">${dateLabel} - ${entry.packageName || 'Booked Session'}</p>
                        <p class="text-xs text-gray-500 mt-0.5">${subtitle}</p>
                    </div>
                    ${isBlocked ? '<button type="button" data-remove-block-id="' + (entry.id || '') + '" class="text-[10px] font-bold text-red-600 hover:text-red-700">Remove</button>' : ''}
                </div>
            `;
        }).join('');
    }

    function renderCalendarGrid(monthBookings) {
        if (!calendarGrid) {
            return;
        }

        const firstWeekday = visibleMonthStart.getDay();
        const totalDays = new Date(visibleMonthStart.getFullYear(), visibleMonthStart.getMonth() + 1, 0).getDate();
        const prevMonthTotalDays = new Date(visibleMonthStart.getFullYear(), visibleMonthStart.getMonth(), 0).getDate();

        const bookingsByDay = new Map();
        monthBookings.forEach((entry) => {
            const day = entry.parsedDate.getDate();
            const current = bookingsByDay.get(day) || [];
            current.push(entry);
            bookingsByDay.set(day, current);
        });

        const cells = [];

        for (let index = 0; index < 42; index += 1) {
            const dayNumber = index - firstWeekday + 1;
            const inMonth = dayNumber >= 1 && dayNumber <= totalDays;

            if (!inMonth) {
                const overflowDay = dayNumber < 1
                    ? prevMonthTotalDays + dayNumber
                    : dayNumber - totalDays;
                cells.push(`
                    <div class="bg-gray-50 min-h-[100px] p-1.5 sm:p-2 cursor-not-allowed">
                        <span class="text-xs sm:text-sm font-medium text-gray-400">${overflowDay}</span>
                    </div>
                `);
                continue;
            }

            const dayBookings = bookingsByDay.get(dayNumber) || [];
            const firstBooking = dayBookings[0];
            const style = firstBooking ? getCalendarEventStyle(firstBooking.status) : null;
            const highlighted = selectedCalendarCell === dayNumber;
            const isBlocked = firstBooking && normalizeBookingStatus(firstBooking.status) === 'blocked';

            cells.push(`
                <div data-calendar-day="${dayNumber}" class="${isBlocked ? 'bg-gray-100' : (firstBooking ? 'bg-blue-50/20' : 'bg-white')} min-h-[100px] p-1.5 sm:p-2 hover:bg-blue-50/50 cursor-pointer transition ${highlighted ? 'ring-2 ring-inset ring-slate-900' : ''}">
                    <span class="text-xs sm:text-sm font-bold text-slate-900">${dayNumber}</span>
                    ${firstBooking ? `
                        <div class="mt-1 ${style.cardClass} rounded px-1.5 py-1 text-[10px] font-bold shadow-sm flex flex-col gap-0.5 leading-tight transition">
                            <span class="truncate">${normalizeBookingStatus(firstBooking.status) === 'blocked' ? 'Blocked' : (firstBooking.time || 'Time pending')}</span>
                            <span class="truncate ${style.titleClass}">${firstBooking.packageName || 'Session'}</span>
                        </div>
                    ` : ''}
                    ${dayBookings.length > 1 ? `<div class="text-[10px] font-semibold text-gray-500 mt-1">+${dayBookings.length - 1} more</div>` : ''}
                </div>
            `);
        }

        calendarGrid.innerHTML = cells.join('');
    }

    function updateCalendarMonth() {
        if (monthLabelButton) {
            monthLabelButton.innerHTML = `<i data-lucide="calendar" class="w-4 h-4"></i> ${formatCalendarMonthLabel(visibleMonthStart)}`;
        }

        const monthBookings = getBookingsForVisibleMonth();
        renderUpcomingCalendarList(monthBookings);
        renderCalendarGrid(monthBookings);
        updateBlockActionButton();

        window.refreshLensWorksIcons();
    }

    async function addCalendarBlock() {
        if (!Number.isFinite(selectedCalendarCell)) {
            window.alert('Select a calendar day first, then add a block.');
            return;
        }

        const date = new Date(visibleMonthStart.getFullYear(), visibleMonthStart.getMonth(), selectedCalendarCell);
        const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        const dateKey = toIsoDate(date);
        const existingBlock = getBlockedDayByDate(dateKey);

        if (existingBlock) {
            const shouldRemove = await showConfirmDialog({
                title: 'Remove Calendar Block',
                message: `Remove block for ${dateLabel}?`,
                confirmLabel: 'Remove'
            });
            if (shouldRemove) {
                removeCalendarBlockById(existingBlock.id);
            }
            return;
        }

        const note = await showTextInputDialog({
            title: `Block ${dateLabel}`,
            label: 'Reason',
            placeholder: 'Blocked - Personal Time',
            initialValue: 'Blocked - Personal Time',
            submitLabel: 'Add Block'
        });

        if (!note) {
            return;
        }

        const normalizedNote = note.trim() || 'Blocked - Personal Time';

        const next = [
            ...vendorBlockedDays,
            {
                id: `block-${Date.now()}`,
                date: dateKey,
                packageName: normalizedNote,
                time: 'All Day',
                customer: 'Unavailable'
            }
        ];

        saveBlockedDays(next);
        updateCalendarMonth();
    }

    function simulateAction(button, loadingText, completeText) {
        if (!button) {
            return;
        }

        const original = button.innerHTML;
        button.disabled = true;
        button.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> ${loadingText}`;
        window.refreshLensWorksIcons();

        setTimeout(() => {
            button.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> ${completeText}`;
            window.refreshLensWorksIcons();
            setTimeout(() => {
                button.innerHTML = original;
                button.disabled = false;
                window.refreshLensWorksIcons();
            }, 1500);
        }, 850);
    }

    async function updateBookingStatusFromVendor(bookingId, nextStatus, button) {
        if (!bookingId || !window.LensWorksApi?.bookings?.updateVendorStatus) {
            return;
        }

        const original = button ? button.innerHTML : '';
        if (button) {
            button.disabled = true;
            button.classList.add('pointer-events-none');
            button.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Updating...';
            window.refreshLensWorksIcons();
        }

        const result = await window.LensWorksApi.bookings.updateVendorStatus(bookingId, nextStatus);
        if (!result.ok) {
            if (button) {
                button.disabled = false;
                button.classList.remove('pointer-events-none');
                button.innerHTML = original;
                window.refreshLensWorksIcons();
            }
            return;
        }

        const updated = result.payload?.data?.booking;
        if (updated) {
            vendorBookings = vendorBookings.map((entry) => (
                entry.id === bookingId ? { ...entry, ...updated } : entry
            ));
        }

        renderVendorBookings(vendorBookings);
        updateVendorStats(vendorBookings);
        filterBookings();
        updateCalendarMonth();
    }

    async function deliverGalleryForBooking(bookingId, button) {
        if (!bookingId || !window.LensWorksApi?.galleries?.deliverForBooking) {
            return;
        }

        const original = button ? button.innerHTML : '';
        if (button) {
            button.disabled = true;
            button.classList.add('pointer-events-none');
            button.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Delivering...';
            window.refreshLensWorksIcons();
        }

        const result = await window.LensWorksApi.galleries.deliverForBooking(bookingId);
        if (!result.ok) {
            if (button) {
                button.disabled = false;
                button.classList.remove('pointer-events-none');
                button.innerHTML = original;
                window.refreshLensWorksIcons();
            }
            return;
        }

        const bookingPatch = result.payload?.data?.booking || {};
        const gallery = result.payload?.data?.gallery || {};
        vendorBookings = vendorBookings.map((entry) => (
            entry.id === bookingId
                ? {
                    ...entry,
                    ...bookingPatch,
                    galleryId: bookingPatch.galleryId || gallery.id || entry.galleryId
                }
                : entry
        ));

        renderVendorBookings(vendorBookings);
        updateVendorStats(vendorBookings);
        filterBookings();
        updateCalendarMonth();
    }

    async function hydrateVendorDataFromApi() {
        if (!window.LensWorksApi) {
            markVendorDataFailure('bookings', 'bookings offline');
            markVendorDataFailure('messages', 'messages offline');
            return;
        }

        const bookingsResult = await window.LensWorksApi.bookings.getVendor();
        if (bookingsResult.ok) {
            clearVendorDataFailure('bookings');
            const bookingItems = bookingsResult.payload?.data?.items || [];
            vendorBookings = bookingItems;
            if (bookingItems.length) {
                const firstBookingDate = parseBookingDate(bookingItems[0].date);
                if (firstBookingDate) {
                    visibleMonthStart = new Date(firstBookingDate.getFullYear(), firstBookingDate.getMonth(), 1);
                }

                renderVendorBookings(bookingItems);
                updateVendorStats(bookingItems);
                filterBookings();
            } else {
                renderVendorBookings([]);
                if (vendorStatActiveBookings) {
                    vendorStatActiveBookings.textContent = '0';
                }
            }

            updateCalendarMonth();
        } else {
            markVendorDataFailure('bookings', 'bookings failed to load');
            renderVendorBookings([]);
            if (vendorStatActiveBookings) {
                vendorStatActiveBookings.textContent = '0';
            }
        }

        const conversationsResult = await window.LensWorksApi.messages.listConversations();
        if (!conversationsResult.ok) {
            markVendorDataFailure('messages', 'messages failed to load');
            inquiries = [];
            renderEmptyInquiryState('No messages yet.');
            updateVendorNotificationBadges();
            return;
        }

        clearVendorDataFailure('messages');

        const apiConversations = conversationsResult.payload?.data?.items || [];
        if (!apiConversations.length) {
            inquiries = [];
            activeInquiryId = null;
            renderEmptyInquiryState('No messages yet.');
            updateVendorNotificationBadges();
            return;
        }

        const mappedInquiries = await Promise.all(apiConversations.map(async (item) => {
            const messagesResult = await window.LensWorksApi.messages.listMessages(item.id);
            const apiMessages = messagesResult.ok ? messagesResult.payload?.data?.items || [] : [];
            return {
                id: item.id,
                apiId: item.id,
                name: item.participantName || 'Client',
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
                subtitle: 'Active Inquiry',
                timeLabel: item.lastMessageAt ? formatApiTime(item.lastMessageAt) : 'Now',
                preview: item.lastMessage || 'No messages yet.',
                messages: apiMessages.map((message) => ({
                    direction: message.senderName === item.participantName ? 'incoming' : 'outgoing',
                    body: message.body,
                    time: formatApiTime(message.sentAt)
                }))
            };
        }));

        inquiries = mappedInquiries;
        activeInquiryId = inquiries[0].id;
            renderVendorAnalytics();
        renderInquiryList(inquirySearchInput ? inquirySearchInput.value : '');
        renderInquiryThread();
        updateVendorNotificationBadges();
    }

    async function hydrateVendorPaymentsFromApi() {
        if (!window.LensWorksApi?.payments?.listVendor) {
            markVendorDataFailure('payments', 'payments offline');
            return;
        }

        const result = await window.LensWorksApi.payments.listVendor();
        if (!result.ok) {
            markVendorDataFailure('payments', 'payments failed to load');
            return;
        }

        clearVendorDataFailure('payments');

        const items = result.payload?.data?.items || [];
        renderVendorPaymentHistory(items);
    }

    mainNavBtns.forEach((button) => {
        button.addEventListener('click', () => {
            switchMainView(button.id === 'nav-dashboard-btn' ? 'view-dashboard' : 'view-calendar', button.id);
        });
    });

    if (calendarTrigger) {
        calendarTrigger.addEventListener('click', () => {
            switchMainView('view-calendar', 'nav-calendar-btn');
        });
    }

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => setActiveTab(tab.dataset.target));
    });

    quickTabBtns.forEach((button) => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.vendorTabTarget;
            if (!allowedVendorTabs.has(String(targetTab || '').toLowerCase())) {
                return;
            }

            switchMainView('view-dashboard', 'nav-dashboard-btn');
            setActiveTab(String(targetTab).toLowerCase());
        });
    });

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            isDropdownOpen = !isDropdownOpen;
            if (isDropdownOpen) {
                profileDropdown.classList.remove('hidden');
                setTimeout(() => {
                    profileDropdown.classList.remove('opacity-0', 'scale-95');
                    profileDropdown.classList.add('opacity-100', 'scale-100');
                }, 10);
            } else {
                closeDropdown();
            }
        });

        document.addEventListener('click', (event) => {
            if (isDropdownOpen && !profileDropdown.contains(event.target) && !profileBtn.contains(event.target)) {
                closeDropdown();
            }
        });
    }

    if (notificationButton) {
        notificationButton.addEventListener('click', () => {
            showNotificationPanel('Notifications', buildVendorNotifications());
        });
    }

    if (replyTextarea) {
        replyTextarea.addEventListener('input', function handleInput() {
            this.style.height = 'auto';
            this.style.height = `${this.scrollHeight}px`;
        });
    }

    if (replyButton && replyTextarea) {
        replyButton.addEventListener('click', async () => {
            const body = replyTextarea.value.trim();
            if (!body) {
                replyTextarea.focus();
                return;
            }

            const inquiry = inquiries.find((entry) => entry.id === activeInquiryId);
            if (!inquiry) {
                return;
            }

            let message = { direction: 'outgoing', body, time: formatTime() };
            if (inquiry.apiId) {
                const result = await window.LensWorksApi.messages.send(inquiry.apiId, { body });
                if (result.ok) {
                    message = {
                        direction: 'outgoing',
                        body: result.payload?.data?.message?.body || body,
                        time: formatApiTime(result.payload?.data?.message?.sentAt)
                    };
                }
            }

            inquiry.messages.push(message);
            inquiry.preview = body;
            inquiry.timeLabel = 'Now';
            replyTextarea.value = '';
            replyTextarea.style.height = 'auto';
            renderInquiryList(inquirySearchInput ? inquirySearchInput.value : '');
            renderInquiryThread();
        });
    }

    if (inquirySearchInput) {
        inquirySearchInput.addEventListener('input', () => {
            renderInquiryList(inquirySearchInput.value);
        });
    }

    if (bookingFilter) {
        bookingFilter.addEventListener('change', filterBookings);
    }

    if (newPackageButton) {
        newPackageButton.addEventListener('click', async () => {
            const payload = await showPackageDialog();
            if (!payload) {
                return;
            }

            const result = await window.LensWorksApi.vendors.createMyPackage(payload);

            if (!result.ok) {
                return;
            }

            await hydrateVendorPackagesFromApi();
        });
    }

    if (packageGrid) {
        packageGrid.addEventListener('click', async (event) => {
            const actionButton = event.target.closest('[data-package-action][data-package-id]');
            if (!actionButton) {
                return;
            }

            const packageId = actionButton.dataset.packageId;
            const action = actionButton.dataset.packageAction;
            const target = vendorPackages.find((entry) => entry.id === packageId);
            if (!packageId || !action || !target) {
                return;
            }

            if (action === 'delete') {
                const confirmed = await showConfirmDialog({
                    title: 'Delete Package',
                    message: `Delete package "${target.name}"?`,
                    confirmLabel: 'Delete'
                });
                if (!confirmed) {
                    return;
                }

                const result = await window.LensWorksApi.vendors.deleteMyPackage(packageId);
                if (!result.ok) {
                    return;
                }

                await hydrateVendorPackagesFromApi();
                return;
            }

            if (action === 'edit') {
                const payload = await showPackageDialog(target);
                if (!payload) {
                    return;
                }

                const result = await window.LensWorksApi.vendors.updateMyPackage(packageId, payload);

                if (!result.ok) {
                    return;
                }

                await hydrateVendorPackagesFromApi();
            }
        });
    }

    if (bookingListContainer) {
        bookingListContainer.addEventListener('click', async (event) => {
            const actionButton = event.target.closest('[data-booking-action][data-booking-id]');
            if (!actionButton) {
                return;
            }

            const bookingId = actionButton.dataset.bookingId;
            const action = actionButton.dataset.bookingAction;
            if (!bookingId || !action) {
                return;
            }

            if (action === 'confirm') {
                updateBookingStatusFromVendor(bookingId, 'CONFIRMED', actionButton);
                return;
            }

            if (action === 'cancel') {
                const allowed = await showConfirmDialog({
                    title: 'Decline Booking',
                    message: 'Decline this booking request?',
                    confirmLabel: 'Decline'
                });
                if (!allowed) {
                    return;
                }
                updateBookingStatusFromVendor(bookingId, 'CANCELED', actionButton);
                return;
            }

            if (action === 'complete') {
                updateBookingStatusFromVendor(bookingId, 'COMPLETED', actionButton);
                return;
            }

            if (action === 'deliver-gallery') {
                deliverGalleryForBooking(bookingId, actionButton);
                return;
            }

            if (action === 'open-gallery') {
                const galleryId = actionButton.dataset.galleryId;
                if (!galleryId) {
                    return;
                }
                window.location.href = `gallery.html?id=${encodeURIComponent(galleryId)}`;
            }
        });
    }

    if (addBlockButton) {
        addBlockButton.addEventListener('click', addCalendarBlock);
    }

    if (upcomingList) {
        upcomingList.addEventListener('click', (event) => {
            const removeButton = event.target.closest('[data-remove-block-id]');
            if (!removeButton) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            const blockId = removeButton.dataset.removeBlockId;
            if (!blockId) {
                return;
            }

            removeCalendarBlockById(blockId);
        });
    }

    if (calendarButtons[0]) {
        calendarButtons[0].addEventListener('click', () => {
            visibleMonthStart = new Date(visibleMonthStart.getFullYear(), visibleMonthStart.getMonth() - 1, 1);
            updateCalendarMonth();
        });
    }

    if (calendarButtons[2]) {
        calendarButtons[2].addEventListener('click', () => {
            visibleMonthStart = new Date(visibleMonthStart.getFullYear(), visibleMonthStart.getMonth() + 1, 1);
            updateCalendarMonth();
        });
    }

    if (calendarGrid) {
        calendarGrid.addEventListener('click', (event) => {
            const target = event.target.closest('[data-calendar-day]');
            if (!target) {
                return;
            }

            const day = Number(target.dataset.calendarDay);
            if (!Number.isFinite(day)) {
                return;
            }

            selectedCalendarCell = day;
            updateCalendarMonth();
        });
    }

    Array.from(document.querySelectorAll('button')).forEach((button) => {
        const text = button.textContent.trim();
        if (text.includes('Withdraw Now')) {
            button.addEventListener('click', () => simulateAction(button, 'Sending...', 'Requested'));
        }
        if (text.includes('Deliver Photos')) {
            button.addEventListener('click', () => simulateAction(button, 'Uploading...', 'Delivery Ready'));
        }
        if (text.includes('Remind')) {
            button.addEventListener('click', () => simulateAction(button, 'Sending...', 'Reminder Sent'));
        }
    });

    switchMainView(initialVendorView === 'calendar' ? 'view-calendar' : 'view-dashboard', initialVendorView === 'calendar' ? 'nav-calendar-btn' : 'nav-dashboard-btn');
    vendorBlockedDays = readBlockedDays();
    setActiveTab(initialVendorTab);
    updateVendorNotificationBadges();
    renderEmptyInquiryState('Loading messages...');
    filterBookings();
    updateCalendarMonth();
    hydrateVendorIdentityFromApi();
    hydrateVendorDataFromApi();
    hydrateVendorPaymentsFromApi();
    hydrateVendorPackagesFromApi();
});