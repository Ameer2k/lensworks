document.addEventListener('DOMContentLoaded', () => {
    const pageParams = new URLSearchParams(window.location.search);
    const requestedConversationId = String(pageParams.get('conversation') || '').trim();
    const requestedTab = String(pageParams.get('tab') || '').trim().toLowerCase();
    const allowedTabs = new Set(['upcoming', 'messages', 'vault', 'payments', 'history', 'reviews']);
    const initialTabKey = requestedConversationId
        ? 'messages'
        : (allowedTabs.has(requestedTab) ? requestedTab : 'upcoming');
    const tabs = Array.from(document.querySelectorAll('.tab-btn'));
    const contents = Array.from(document.querySelectorAll('.tab-content'));
    const profileBtn = document.getElementById('profile-menu-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    const profileNameNode = document.getElementById('client-profile-name');
    const profileRoleNode = document.getElementById('client-profile-role');
    const profileAvatarNode = document.getElementById('client-profile-avatar');
    const welcomeTitleNode = document.getElementById('client-welcome-title');
    const welcomeSubtitleNode = document.getElementById('client-welcome-subtitle');
    const dashboardMain = document.querySelector('main');
    const vaultSearchInput = document.querySelector('input[placeholder="Search events..."]');
    const conversationSearchInput = document.getElementById('client-conversation-search');
    const paymentsSearchInput = document.getElementById('payments-search-input');
    const paymentsTypeFilter = document.getElementById('payments-type-filter');
    const paymentsStatusFilter = document.getElementById('payments-status-filter');
    const paymentsExportCsvButton = document.getElementById('payments-export-csv-btn');
    const clientPaymentsList = document.getElementById('client-payments-list');
    const clientPaymentsCount = document.getElementById('client-payments-count');
    const clientPaymentsTotal = document.getElementById('client-payments-total');
    const clientPaymentsLatest = document.getElementById('client-payments-latest');
    const chatTextarea = document.getElementById('client-chat-input');
    const sendButton = document.getElementById('client-send-btn');
    const notificationButton = document.getElementById('client-notification-btn');
    const historyList = document.getElementById('client-history-list');
    const reviewsGivenList = document.getElementById('client-reviews-given-list');
    const reviewBookingSelect = document.getElementById('review-booking-select');
    const reviewStarsContainer = document.getElementById('review-stars');
    const reviewBodyInput = document.getElementById('review-body-input');
    const reviewStatusMsg = document.getElementById('review-status-msg');
    const submitReviewBtn = document.getElementById('submit-review-btn');
    const messageSidebar = document.querySelector('#tab-messages .w-1\/3 .flex-1.overflow-y-auto');
    const messageHeader = document.querySelector('#tab-messages .flex-1 .px-6.py-5');
    const messagesArea = document.querySelector('#tab-messages .flex-1 .flex-1.overflow-y-auto');
    const vaultGrid = document.querySelector('#tab-vault .grid.grid-cols-1.md\:grid-cols-2.lg\:grid-cols-3');
    const upcomingMessageButton = document.getElementById('upcoming-message-btn');
    const payBalanceButton = document.getElementById('upcoming-pay-balance-btn');
    const bookNewSessionButton = document.getElementById('book-new-session-btn');
    const zipButtons = Array.from(document.querySelectorAll('#tab-vault button')).filter((button) => button.textContent.includes('ZIP'));
    const shareButtons = Array.from(document.querySelectorAll('#tab-vault button')).filter((button) => button.title === 'Share Gallery');
    const upcomingBookingId = document.getElementById('upcoming-booking-id');
    const upcomingBookingMonth = document.getElementById('upcoming-booking-month');
    const upcomingBookingDay = document.getElementById('upcoming-booking-day');
    const upcomingBookingTime = document.getElementById('upcoming-booking-time');
    const upcomingBookingTitle = document.getElementById('upcoming-booking-title');
    const upcomingBookingPhotographer = document.getElementById('upcoming-booking-photographer');
    const upcomingBookingLocation = document.getElementById('upcoming-booking-location');
    const upcomingBookingDuration = document.getElementById('upcoming-booking-duration');
    const paymentPackageLabel = document.getElementById('upcoming-payment-package-label');
    const paymentPackagePrice = document.getElementById('upcoming-payment-package-price');
    const paymentAddonLabel = document.getElementById('upcoming-payment-addon-label');
    const paymentAddonPrice = document.getElementById('upcoming-payment-addon-price');
    const paymentSubtotal = document.getElementById('upcoming-payment-subtotal');
    const paymentDeposit = document.getElementById('upcoming-payment-deposit');
    const paymentDue = document.getElementById('upcoming-payment-due');
    const paymentDueDate = document.getElementById('upcoming-payment-due-date');
    const upcomingBookingStatus = document.getElementById('upcoming-booking-status');
    const upcomingManageButton = document.getElementById('upcoming-manage-btn');
    const cancelBookingButton = document.getElementById('upcoming-cancel-booking-btn');
    const rescheduleButton = document.getElementById('upcoming-reschedule-btn');
    const quickUpcomingCount = document.getElementById('quick-upcoming-count');
    const quickGalleriesCount = document.getElementById('quick-galleries-count');
    const quickTotalSpent = document.getElementById('quick-total-spent');
    const clientBellBadge = document.getElementById('client-bell-badge');
    const clientMessagesTabBadge = document.getElementById('client-messages-tab-badge');
    const upcomingProgressFill = document.getElementById('upcoming-progress-fill');
    const clientPaymentHistoryList = document.getElementById('client-payment-history');
    const timelineSteps = [
        {
            dot: document.getElementById('upcoming-step-requested-dot'),
            label: document.getElementById('upcoming-step-requested-label')
        },
        {
            dot: document.getElementById('upcoming-step-deposit-dot'),
            label: document.getElementById('upcoming-step-deposit-label')
        },
        {
            dot: document.getElementById('upcoming-step-shoot-dot'),
            label: document.getElementById('upcoming-step-shoot-label')
        },
        {
            dot: document.getElementById('upcoming-step-delivered-dot'),
            label: document.getElementById('upcoming-step-delivered-label')
        }
    ];

    let conversations = [];

    let activeConversationId = null;
    let isDropdownOpen = false;
    let activeBooking = null;
    let clientBookings = [];
    let clientPastBookings = [];
    let clientSubmittedReviews = [];
    let clientPayments = [];
    let currentReviewRating = 0;
    let activeClientUser = null;
    let activeClientProfile = null;
    const clientDataFailures = new Map();

    function initialsFromName(name) {
        const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
        if (!parts.length) {
            return 'CL';
        }
        return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
    }

    function avatarFromName(name) {
        const initials = encodeURIComponent(initialsFromName(name));
        return `https://ui-avatars.com/api/?name=${initials}&background=0f172a&color=ffffff&bold=true&size=128`;
    }

    function applyClientIdentity() {
        const session = window.LensWorksStore?.getSession?.() || {};
        const displayName = String(activeClientUser?.fullName || session.name || '').trim() || 'LensWorks Client';
        const firstName = displayName.split(' ')[0] || 'there';

        if (profileNameNode) {
            profileNameNode.textContent = displayName;
        }
        if (profileRoleNode) {
            profileRoleNode.textContent = 'Client';
        }
        if (profileAvatarNode) {
            profileAvatarNode.src = avatarFromName(displayName);
            profileAvatarNode.alt = `${displayName} profile`;
        }
        if (welcomeTitleNode) {
            welcomeTitleNode.textContent = `Welcome back, ${firstName}`;
        }
        if (welcomeSubtitleNode) {
            welcomeSubtitleNode.textContent = 'Here is what\'s happening with your photography bookings.';
        }

        if (window.LensWorksStore?.setSession) {
            window.LensWorksStore.setSession({
                ...(session || {}),
                role: 'client',
                name: displayName,
                email: activeClientUser?.email || session.email || ''
            });
        }
    }

    function renderClientProfilePrompt() {
        if (!dashboardMain) {
            return;
        }

        const existing = document.getElementById('client-profile-setup-banner');
        const incomplete = !activeClientProfile
            || !String(activeClientProfile.location || '').trim()
            || String(activeClientProfile.biography || '').trim().length < 40;

        if (!incomplete) {
            if (existing) {
                existing.remove();
            }
            return;
        }

        const message = 'Complete your client profile to personalize bookings, location defaults, and communication preferences.';
        const markup = `
            <div id="client-profile-setup-banner" class="mb-6 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 px-4 py-3 text-sm font-medium flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <span>${message}</span>
                <a href="account-settings.html" class="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition">Complete Profile</a>
            </div>
        `;

        if (existing) {
            existing.outerHTML = markup;
            return;
        }

        dashboardMain.insertAdjacentHTML('afterbegin', markup);
    }

    function formatApiTime(value) {
        if (!value) {
            return formatTimestamp();
        }

        return new Date(value).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    function formatApiDay(value) {
        if (!value) {
            return 'Today';
        }

        const d = new Date(value);
        const now = new Date();
        const sameDay = d.toDateString() === now.toDateString();
        return sameDay ? 'Today' : d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    }

    function formatMoney(value) {
        return `$${Number(value || 0).toFixed(2)}`;
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getClientReviewAuthorCandidates() {
        const session = window.LensWorksStore?.getSession?.() || {};
        const names = new Set();
        [
            activeClientUser?.fullName,
            session.name,
            activeClientProfile?.fullName,
            [activeClientProfile?.firstName, activeClientProfile?.lastName].filter(Boolean).join(' ')
        ].forEach((entry) => {
            const normalized = String(entry || '').trim().toLowerCase();
            if (normalized) {
                names.add(normalized);
            }
        });
        return names;
    }

    function renderClientSubmittedReviews(items) {
        if (!reviewsGivenList) {
            return;
        }

        if (!Array.isArray(items) || !items.length) {
            reviewsGivenList.innerHTML = '<div class="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-sm text-gray-500">Reviews you submit will appear here.</div>';
            return;
        }

        reviewsGivenList.innerHTML = items.map((review) => {
            const rating = Math.max(0, Math.min(5, Number(review.rating || 0)));
            const stars = `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`;
            const dateLabel = review.createdAt
                ? new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Recently';
            const vendorLabel = review.vendorName || 'Vendor';
            return `
                <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-3">
                        <div>
                            <p class="font-bold text-slate-900">${escapeHtml(vendorLabel)}</p>
                            <p class="text-xs text-gray-400 mt-0.5">${dateLabel}</p>
                        </div>
                        <span class="text-yellow-400 text-lg leading-none">${stars}</span>
                    </div>
                    <p class="text-sm text-slate-700 leading-relaxed">${escapeHtml(review.body)}</p>
                </div>
            `;
        }).join('');
    }

    function setBadgeValue(element, count) {
        if (!element) {
            return;
        }

        const next = Math.max(0, Number(count || 0));
        element.textContent = String(next);
        element.classList.toggle('hidden', next === 0);
    }

    function updateClientNotificationBadges() {
        const conversationCount = Array.isArray(conversations) ? conversations.length : 0;
        const pendingPaymentCount = clientPayments.filter((item) => String(item.status || '').toUpperCase() === 'PENDING').length;
        const bookingNeedsAction = activeBooking && String(activeBooking.status || '').toUpperCase() === 'PENDING' ? 1 : 0;
        const total = conversationCount + pendingPaymentCount + bookingNeedsAction;

        setBadgeValue(clientMessagesTabBadge, conversationCount);
        setBadgeValue(clientBellBadge, total);
    }

    function renderClientDataStatus() {
        if (!dashboardMain) {
            return;
        }

        const existing = document.getElementById('client-dashboard-status');
        if (!clientDataFailures.size) {
            if (existing) {
                existing.remove();
            }
            return;
        }

        const text = Array.from(clientDataFailures.values()).join(' • ');
        const markup = `
            <div id="client-dashboard-status" class="mb-6 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm font-medium">
                Live data is partially unavailable: ${text}
            </div>
        `;

        if (existing) {
            existing.outerHTML = markup;
            return;
        }

        dashboardMain.insertAdjacentHTML('afterbegin', markup);
    }

    function markClientDataFailure(scope, message) {
        clientDataFailures.set(scope, message);
        renderClientDataStatus();
    }

    function clearClientDataFailure(scope) {
        clientDataFailures.delete(scope);
        renderClientDataStatus();
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

    function formatPaymentStatus(status) {
        const normalized = String(status || '').toUpperCase();
        if (normalized === 'SUCCEEDED') {
            return {
                label: 'Succeeded',
                className: 'bg-green-50 text-green-700 border border-green-200'
            };
        }

        if (normalized === 'PENDING') {
            return {
                label: 'Pending',
                className: 'bg-amber-50 text-amber-700 border border-amber-200'
            };
        }

        if (normalized === 'FAILED') {
            return {
                label: 'Failed',
                className: 'bg-red-50 text-red-700 border border-red-200'
            };
        }

        return {
            label: normalized || 'Unknown',
            className: 'bg-gray-50 text-gray-700 border border-gray-200'
        };
    }

    function getPaymentBookingLabel(payment) {
        const bookingId = String(payment.bookingId || '');
        if (!bookingId) {
            return 'Session Booking';
        }

        const match = clientBookings.find((entry) => String(entry.id) === bookingId);
        if (match?.packageName) {
            return match.packageName;
        }

        return `Booking ${bookingId}`;
    }

    function renderClientPaymentHistory(items) {
        if (!clientPaymentHistoryList) {
            return;
        }

        const entries = Array.isArray(items) ? items.slice(0, 5) : [];
        if (!entries.length) {
            clientPaymentHistoryList.innerHTML = '<p class="text-xs text-gray-500">No payments recorded yet.</p>';
            window.refreshLensWorksIcons();
            return;
        }

        clientPaymentHistoryList.innerHTML = entries.map((item) => {
            const paidOn = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
                : 'Pending date';

            return `
                <div class="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                    <div class="min-w-0 pr-3">
                        <p class="text-xs font-semibold text-slate-900 truncate">${formatPaymentType(item.type)} - ${getPaymentBookingLabel(item)}</p>
                        <p class="text-[11px] text-gray-500">${paidOn}</p>
                    </div>
                    <p class="text-xs font-bold text-slate-900">-${formatMoney(item.amount)}</p>
                </div>
            `;
        }).join('');

        window.refreshLensWorksIcons();
    }

    function getFilteredClientPayments() {
        const searchValue = String(paymentsSearchInput?.value || '').trim().toLowerCase();
        const selectedType = String(paymentsTypeFilter?.value || 'ALL').toUpperCase();
        const selectedStatus = String(paymentsStatusFilter?.value || 'ALL').toUpperCase();

        return clientPayments.filter((payment) => {
            const paymentType = String(payment.type || '').toUpperCase();
            const paymentStatus = String(payment.status || '').toUpperCase();
            const bookingLabel = getPaymentBookingLabel(payment).toLowerCase();
            const paymentLabel = formatPaymentType(payment.type).toLowerCase();

            const typeOk = selectedType === 'ALL' || paymentType === selectedType;
            const statusOk = selectedStatus === 'ALL' || paymentStatus === selectedStatus;
            const searchOk = !searchValue
                || bookingLabel.includes(searchValue)
                || paymentLabel.includes(searchValue)
                || String(payment.reference || '').toLowerCase().includes(searchValue);

            return typeOk && statusOk && searchOk;
        });
    }

    function escapeCsvCell(value) {
        const normalized = String(value ?? '');
        if (/[",\n]/.test(normalized)) {
            return `"${normalized.replace(/"/g, '""')}"`;
        }
        return normalized;
    }

    function exportPaymentsCsv() {
        const rows = getFilteredClientPayments();
        if (!rows.length) {
            return;
        }

        const header = [
            'payment_id',
            'booking_id',
            'booking_label',
            'type',
            'status',
            'amount',
            'currency',
            'reference',
            'created_at'
        ];

        const csvLines = [header.join(',')];
        rows.forEach((item) => {
            const line = [
                escapeCsvCell(item.id || ''),
                escapeCsvCell(item.bookingId || ''),
                escapeCsvCell(getPaymentBookingLabel(item)),
                escapeCsvCell(String(item.type || '').toUpperCase()),
                escapeCsvCell(String(item.status || '').toUpperCase()),
                escapeCsvCell(Number(item.amount || 0).toFixed(2)),
                escapeCsvCell(item.currency || 'USD'),
                escapeCsvCell(item.reference || ''),
                escapeCsvCell(item.createdAt || '')
            ];
            csvLines.push(line.join(','));
        });

        const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        const datePart = new Date().toISOString().slice(0, 10);
        anchor.href = url;
        anchor.download = `lensworks-payments-${datePart}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    }

    function renderClientPaymentsTab(items) {
        if (!clientPaymentsList) {
            return;
        }

        const allItems = Array.isArray(items) ? items : [];
        const visibleItems = getFilteredClientPayments();
        const totalAmount = allItems.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

        if (clientPaymentsCount) {
            clientPaymentsCount.textContent = String(allItems.length);
        }
        if (clientPaymentsTotal) {
            clientPaymentsTotal.textContent = formatMoney(totalAmount);
        }
        if (clientPaymentsLatest) {
            const latestItem = allItems[0];
            clientPaymentsLatest.textContent = latestItem?.createdAt
                ? new Date(latestItem.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
                : '-';
        }

        if (!visibleItems.length) {
            clientPaymentsList.innerHTML = '<div class="p-5 text-sm text-gray-500">No payments match your current filters.</div>';
            window.refreshLensWorksIcons();
            return;
        }

        clientPaymentsList.innerHTML = visibleItems.map((item) => {
            const createdAtLabel = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                : 'Pending date';
            const statusMeta = formatPaymentStatus(item.status);

            return `
                <div class="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-gray-50 transition">
                    <div class="min-w-0">
                        <p class="font-semibold text-sm text-slate-900">${formatPaymentType(item.type)} - ${getPaymentBookingLabel(item)}</p>
                        <p class="text-xs text-gray-500 mt-1">Ref: ${item.reference || 'N/A'} • ${createdAtLabel}</p>
                    </div>
                    <div class="flex items-center gap-3 md:gap-4">
                        <span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${statusMeta.className}">${statusMeta.label}</span>
                        <p class="font-bold text-sm text-slate-900">-${formatMoney(item.amount)}</p>
                    </div>
                </div>
            `;
        }).join('');

        window.refreshLensWorksIcons();
    }

    function buildClientNotifications() {
        const entries = [];

        if (activeBooking) {
            const due = Math.max(Number(activeBooking.total || 0) - Number(activeBooking.deposit || 0), 0);
            if (due > 0) {
                entries.push({
                    title: 'Balance payment pending',
                    body: `${formatMoney(due)} remains for ${activeBooking.packageName || 'your session'}.`,
                    actionLabel: 'Open Payments',
                    action: () => setActiveTab('payments')
                });
            }

            if (String(activeBooking.status || '').toUpperCase() === 'PENDING') {
                entries.push({
                    title: 'Booking awaiting approval',
                    body: 'Your latest booking is pending vendor confirmation.',
                    actionLabel: 'View Booking',
                    action: () => setActiveTab('upcoming')
                });
            }
        }

        if (conversations.length) {
            entries.push({
                title: 'Unread messages',
                body: `${conversations.length} conversation${conversations.length === 1 ? '' : 's'} need attention.`,
                actionLabel: 'Open Messages',
                action: () => setActiveTab('messages')
            });
        }

        if (!entries.length) {
            entries.push({
                title: 'All caught up',
                body: 'No urgent updates right now.',
                actionLabel: 'Stay Here',
                action: () => setActiveTab('upcoming')
            });
        }

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
                <div class="p-4 space-y-3 max-h-[60vh] overflow-y-auto" id="notifications-list"></div>
            </div>
        `;

        const list = overlay.querySelector('#notifications-list');
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

            const actionButton = row.querySelector('button');
            actionButton.addEventListener('click', () => {
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

            const cancelButton = overlay.querySelector('[data-action="cancel"]');
            const confirmButton = overlay.querySelector('[data-action="confirm"]');
            cancelButton.addEventListener('click', () => close(false));
            confirmButton.addEventListener('click', () => close(true));

            document.body.appendChild(overlay);
        });
    }

    function showRescheduleDialog(booking) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 z-[140] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4';
            overlay.innerHTML = `
                <div class="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
                    <div class="px-5 py-4 border-b border-gray-100">
                        <h3 class="text-base font-bold text-slate-900">Request Reschedule</h3>
                    </div>
                    <form id="reschedule-dialog-form" class="px-5 py-4 space-y-4">
                        <div>
                            <label class="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">New Date</label>
                            <input name="date" type="date" value="${booking.date || ''}" class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" required>
                        </div>
                        <div>
                            <label class="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">New Time</label>
                            <input name="time" type="text" value="${booking.time || ''}" class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" placeholder="e.g. 3:00 PM" required>
                        </div>
                        <div>
                            <label class="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Location</label>
                            <input name="location" type="text" value="${booking.location || ''}" class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" required>
                        </div>
                        <div>
                            <label class="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Reason (Optional)</label>
                            <textarea name="reason" rows="3" class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" placeholder="Tell your photographer why you need to reschedule">${booking.rescheduleReason || ''}</textarea>
                        </div>
                        <div class="pt-2 flex justify-end gap-2 border-t border-gray-100">
                            <button type="button" data-action="cancel" class="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-slate-700 hover:bg-gray-50 transition">Cancel</button>
                            <button type="submit" class="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition">Submit Request</button>
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

            const form = overlay.querySelector('#reschedule-dialog-form');
            const cancelButton = overlay.querySelector('[data-action="cancel"]');

            cancelButton.addEventListener('click', () => close(null));
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const data = new FormData(form);
                const payload = {
                    date: String(data.get('date') || '').trim(),
                    time: String(data.get('time') || '').trim(),
                    location: String(data.get('location') || '').trim(),
                    reason: String(data.get('reason') || '').trim()
                };

                if (!payload.date || !payload.time || !payload.location) {
                    return;
                }

                close(payload);
            });

            document.body.appendChild(overlay);
        });
    }

    function parseBookingDate(value) {
        if (!value) {
            return null;
        }

        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function getStatusBadge(status) {
        const normalized = String(status || '').toUpperCase();
        if (normalized === 'CONFIRMED') {
            return {
                label: 'Confirmed',
                className: 'text-[10px] font-bold uppercase tracking-wider bg-green-500/20 text-green-200 px-2.5 py-1 rounded-full'
            };
        }

        if (normalized === 'PENDING') {
            return {
                label: 'Pending',
                className: 'text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-200 px-2.5 py-1 rounded-full'
            };
        }

        if (normalized === 'CANCELED') {
            return {
                label: 'Canceled',
                className: 'text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-200 px-2.5 py-1 rounded-full'
            };
        }

        return {
            label: normalized || 'Scheduled',
            className: 'text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-200 px-2.5 py-1 rounded-full'
        };
    }

    function getMostRelevantBooking(items) {
        const now = new Date();
        const normalized = items
            .map((item) => ({
                ...item,
                parsedDate: parseBookingDate(item.date)
            }))
            .sort((a, b) => {
                const aTime = a.parsedDate ? a.parsedDate.getTime() : Number.MAX_SAFE_INTEGER;
                const bTime = b.parsedDate ? b.parsedDate.getTime() : Number.MAX_SAFE_INTEGER;
                return aTime - bTime;
            });

        const nextUpcoming = normalized.find((item) => item.parsedDate && item.parsedDate.getTime() >= now.getTime());
        if (nextUpcoming) {
            return nextUpcoming;
        }

        return normalized[normalized.length - 1] || items[0];
    }

    function applyQuickStats(items) {
        if (!Array.isArray(items) || !items.length) {
            return;
        }

        if (quickUpcomingCount) {
            quickUpcomingCount.textContent = String(items.length);
        }

        if (quickTotalSpent) {
            const totalSpent = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
            quickTotalSpent.textContent = formatMoney(totalSpent);
        }

        if (quickGalleriesCount && vaultGrid) {
            const galleryCards = Array.from(vaultGrid.children).filter((entry) => !entry.dataset.vaultEmpty);
            quickGalleriesCount.textContent = String(galleryCards.length);
        }
    }

    function updateTimelineStep(step, state) {
        if (!step || !step.dot || !step.label) {
            return;
        }

        if (state === 'complete') {
            step.dot.className = 'w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white shadow-sm ring-4 ring-gray-50/50';
            step.dot.innerHTML = '<i data-lucide="check" class="w-3 h-3"></i>';
            step.label.className = 'text-[10px] font-bold text-slate-900 uppercase tracking-wider';
            return;
        }

        if (state === 'active') {
            step.dot.className = 'w-6 h-6 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center shadow-sm ring-4 ring-gray-50/50';
            step.dot.innerHTML = '<div class="w-2 h-2 bg-blue-500 rounded-full"></div>';
            step.label.className = 'text-[10px] font-bold text-blue-600 uppercase tracking-wider';
            return;
        }

        step.dot.className = 'w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shadow-sm ring-4 ring-gray-50/50';
        step.dot.innerHTML = '';
        step.label.className = 'text-[10px] font-bold text-gray-400 uppercase tracking-wider';
    }

    function updateBookingTimeline(booking, due) {
        if (!booking) {
            return;
        }

        const status = String(booking.status || '').toUpperCase();
        const bookingDate = parseBookingDate(booking.date);
        const now = new Date();
        const canceled = status === 'CANCELED';
        const shootReached = bookingDate ? bookingDate.getTime() <= now.getTime() : false;
        const delivered = status === 'DELIVERED' || status === 'COMPLETED';
        const depositPaid = due <= 0 || Number(booking.deposit || 0) > 0 || status === 'CONFIRMED';

        let completedCount = 1;
        let activeIndex = 1;

        if (canceled) {
            completedCount = 1;
            activeIndex = -1;
        }

        if (!canceled && depositPaid) {
            completedCount = 2;
            activeIndex = 2;
        }

        if (!canceled && shootReached) {
            completedCount = 3;
            activeIndex = 3;
        }

        if (!canceled && delivered) {
            completedCount = 4;
            activeIndex = -1;
        }

        timelineSteps.forEach((step, index) => {
            if (index < completedCount) {
                updateTimelineStep(step, 'complete');
                return;
            }

            if (index === activeIndex) {
                updateTimelineStep(step, 'active');
                return;
            }

            updateTimelineStep(step, 'inactive');
        });

        if (upcomingProgressFill) {
            const segmentCount = 3;
            const completeSegments = Math.max(0, Math.min(completedCount - 1, segmentCount));
            const percent = (completeSegments / segmentCount) * 100;
            upcomingProgressFill.style.width = `${percent}%`;
        }

        window.refreshLensWorksIcons();
    }

    function setUpcomingBookingCard(booking) {
        if (!booking || !upcomingBookingId) {
            return;
        }

        activeBooking = booking;

        const date = booking.date ? new Date(booking.date) : null;
        const month = date ? date.toLocaleDateString('en-US', { month: 'long' }) : 'TBD';
        const day = date ? date.toLocaleDateString('en-US', { day: '2-digit' }) : '--';
        const deposit = Number(booking.deposit || 0);
        const total = Number(booking.total || 0);
        const due = Math.max(total - deposit, 0);

        upcomingBookingId.textContent = `ID: ${booking.receiptNumber || 'LW-PREVIEW'}`;
        if (upcomingBookingStatus) {
            const status = getStatusBadge(booking.status);
            upcomingBookingStatus.textContent = status.label;
            upcomingBookingStatus.className = status.className;
        }
        upcomingBookingMonth.textContent = month;
        upcomingBookingDay.textContent = day;
        upcomingBookingTime.textContent = booking.time || 'Time pending';
        upcomingBookingTitle.textContent = booking.packageName || 'Upcoming Session';
        upcomingBookingPhotographer.textContent = booking.photographer || 'LensWorks Pro';
        upcomingBookingLocation.textContent = booking.location || 'Location pending';
        upcomingBookingDuration.textContent = booking.duration || 'Session duration pending';

        paymentPackageLabel.textContent = booking.packageName || 'Session Package';
        paymentPackagePrice.textContent = formatMoney(total);
        paymentAddonLabel.textContent = 'Platform Fee';
        paymentAddonPrice.textContent = formatMoney(0);
        paymentSubtotal.textContent = formatMoney(total);
        paymentDeposit.textContent = `- ${formatMoney(deposit)}`;
        paymentDue.textContent = formatMoney(due);

        if (date) {
            const dueDate = new Date(date);
            dueDate.setDate(dueDate.getDate() - 1);
            paymentDueDate.textContent = `Due ${dueDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}`;
        } else {
            paymentDueDate.textContent = 'Due date pending';
        }

        if (payBalanceButton) {
            if (due <= 0) {
                payBalanceButton.disabled = true;
                payBalanceButton.classList.add('opacity-60', 'cursor-not-allowed');
                payBalanceButton.innerHTML = 'Paid in Full <i data-lucide="check" class="w-4 h-4"></i>';
            } else {
                payBalanceButton.disabled = false;
                payBalanceButton.classList.remove('opacity-60', 'cursor-not-allowed');
                payBalanceButton.innerHTML = 'Pay Balance <i data-lucide="arrow-right" class="w-4 h-4"></i>';
            }
            window.refreshLensWorksIcons();
        }

        if (cancelBookingButton) {
            const immutableStatus = ['CANCELED', 'DELIVERED', 'COMPLETED'].includes(String(booking.status || '').toUpperCase());
            cancelBookingButton.disabled = immutableStatus;
            cancelBookingButton.classList.toggle('opacity-60', immutableStatus);
            cancelBookingButton.classList.toggle('cursor-not-allowed', immutableStatus);
            cancelBookingButton.innerHTML = immutableStatus
                ? '<i data-lucide="x-circle" class="w-4 h-4"></i> Not Cancellable'
                : '<i data-lucide="x-circle" class="w-4 h-4"></i> Cancel Booking';
            window.refreshLensWorksIcons();
        }

        if (rescheduleButton) {
            const immutableStatus = ['CANCELED', 'DELIVERED', 'COMPLETED'].includes(String(booking.status || '').toUpperCase());
            rescheduleButton.disabled = immutableStatus;
            rescheduleButton.classList.toggle('opacity-60', immutableStatus);
            rescheduleButton.classList.toggle('cursor-not-allowed', immutableStatus);
            rescheduleButton.innerHTML = immutableStatus
                ? '<i data-lucide="calendar-clock" class="w-4 h-4"></i> Not Reschedulable'
                : '<i data-lucide="calendar-clock" class="w-4 h-4"></i> Request Reschedule';
            window.refreshLensWorksIcons();
        }

        updateBookingTimeline(booking, due);
        updateClientNotificationBadges();
    }

    function renderNoUpcomingBooking() {
        activeBooking = null;
        if (!upcomingBookingId) {
            return;
        }

        upcomingBookingId.textContent = 'ID: -';
        if (upcomingBookingStatus) {
            upcomingBookingStatus.textContent = 'No Booking';
            upcomingBookingStatus.className = 'text-[10px] font-bold uppercase tracking-wider bg-gray-500/20 text-gray-200 px-2.5 py-1 rounded-full';
        }

        upcomingBookingMonth.textContent = 'TBD';
        upcomingBookingDay.textContent = '--';
        upcomingBookingTime.textContent = 'Time pending';
        upcomingBookingTitle.textContent = 'No upcoming booking yet';
        upcomingBookingPhotographer.textContent = 'LensWorks';
        upcomingBookingLocation.textContent = 'Location pending';
        upcomingBookingDuration.textContent = 'Session duration pending';

        paymentPackageLabel.textContent = 'Session Package';
        paymentPackagePrice.textContent = formatMoney(0);
        paymentAddonLabel.textContent = 'Platform Fee';
        paymentAddonPrice.textContent = formatMoney(0);
        paymentSubtotal.textContent = formatMoney(0);
        paymentDeposit.textContent = `- ${formatMoney(0)}`;
        paymentDue.textContent = formatMoney(0);
        paymentDueDate.textContent = 'Due date pending';

        [payBalanceButton, cancelBookingButton, rescheduleButton].forEach((button) => {
            if (!button) {
                return;
            }
            button.disabled = true;
            button.classList.add('opacity-60', 'cursor-not-allowed');
        });

        updateBookingTimeline({ status: 'PENDING' }, 0);
        updateClientNotificationBadges();
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
            if (active) {
                content.classList.remove('hidden');
                content.classList.add('block', 'opacity-100');
                content.classList.remove('opacity-0');
            } else {
                content.classList.add('hidden');
                content.classList.remove('block', 'opacity-100');
                content.classList.add('opacity-0');
            }
        });
    }

    function closeDropdown() {
        if (!profileDropdown) {
            return;
        }

        profileDropdown.classList.remove('opacity-100', 'scale-100');
        profileDropdown.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            profileDropdown.classList.add('hidden');
        }, 150);
        isDropdownOpen = false;
    }

    function formatTimestamp() {
        return new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    function buildDateDivider(label) {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex justify-center';
        wrapper.innerHTML = `<span class="bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">${label}</span>`;
        return wrapper;
    }

    function buildMessageBubble(message, avatar) {
        const wrapper = document.createElement('div');

        if (message.direction === 'incoming') {
            wrapper.className = 'flex justify-start';
            wrapper.innerHTML = `
                <div class="flex gap-3 max-w-[75%]">
                    <img src="${avatar}" class="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1" alt="${avatar}">
                    <div>
                        <div class="bg-white border border-gray-200 text-slate-900 rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm">
                            <p class="text-sm leading-relaxed">${message.body}</p>
                        </div>
                        <span class="text-[10px] text-gray-400 mt-1 block font-medium">${message.time}</span>
                    </div>
                </div>
            `;
        } else {
            wrapper.className = 'flex justify-end';
            wrapper.innerHTML = `
                <div class="max-w-[70%]">
                    <div class="bg-slate-900 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-sm">
                        <p class="text-sm leading-relaxed">${message.body}</p>
                    </div>
                    <span class="text-[10px] text-gray-400 mt-1 block text-right font-medium">${message.time}</span>
                </div>
            `;
        }

        return wrapper;
    }

    function renderConversationList(filterValue = '') {
        if (!messageSidebar) {
            return;
        }

        const normalized = filterValue.trim().toLowerCase();
        const visibleConversations = conversations.filter((conversation) => {
            return !normalized || conversation.name.toLowerCase().includes(normalized) || conversation.preview.toLowerCase().includes(normalized);
        });

        messageSidebar.innerHTML = '';

        if (!visibleConversations.length) {
            messageSidebar.innerHTML = '<div class="p-6 text-sm text-gray-500">No conversations match your search.</div>';
            return;
        }

        visibleConversations.forEach((conversation) => {
            const active = conversation.id === activeConversationId;
            const item = document.createElement('button');
            item.type = 'button';
            item.className = `w-full text-left p-4 border-b border-gray-100 flex gap-4 relative transition ${active ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`;
            item.innerHTML = `
                ${active ? '<div class="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-md"></div>' : ''}
                <div class="relative">
                    <img src="${conversation.avatar}" class="w-12 h-12 rounded-full object-cover shadow-sm ${active ? '' : 'border border-gray-100'}" alt="${conversation.name}">
                    ${conversation.status === 'online' ? '<div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>' : ''}
                </div>
                <div class="flex-1 overflow-hidden pt-1">
                    <div class="flex justify-between items-center mb-1">
                        <h4 class="font-bold text-sm text-slate-900">${conversation.name}</h4>
                        <span class="text-[10px] ${active ? 'text-blue-600 font-bold' : 'text-gray-400'} uppercase">${conversation.timeLabel}</span>
                    </div>
                    <p class="text-sm ${active ? 'text-gray-600 font-medium' : 'text-gray-500'} truncate">${conversation.preview}</p>
                </div>
            `;

            item.addEventListener('click', () => {
                activeConversationId = conversation.id;
                renderConversationList(conversationSearchInput ? conversationSearchInput.value : '');
                renderActiveConversation();
            });

            messageSidebar.appendChild(item);
        });

        if (!visibleConversations.some((entry) => entry.id === activeConversationId)) {
            activeConversationId = visibleConversations[0].id;
        }
    }

    function renderEmptyConversationState(message = 'No messages yet.') {
        if (messageSidebar) {
            messageSidebar.innerHTML = '<div class="p-6 text-sm text-gray-500">No conversations yet.</div>';
        }

        if (messageHeader) {
            messageHeader.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-slate-100 border border-gray-200 flex items-center justify-center">
                        <i data-lucide="message-circle" class="w-4 h-4 text-gray-400"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-900 text-sm">No active conversation</h3>
                        <p class="text-xs text-gray-500 font-medium">Start a new booking to message a photographer.</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <a href="directory.html" class="px-3 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition text-xs font-semibold">Explore Photographers</a>
                </div>
            `;
        }

        if (messagesArea) {
            messagesArea.innerHTML = `<div class="p-6 text-sm text-gray-500">${message}</div>`;
        }

        if (sendButton) {
            sendButton.disabled = true;
            sendButton.classList.add('opacity-60', 'cursor-not-allowed');
        }
        if (chatTextarea) {
            chatTextarea.disabled = true;
            chatTextarea.placeholder = 'Book a session to start messaging.';
        }

        window.refreshLensWorksIcons();
    }

    function renderActiveConversation() {
        const conversation = conversations.find((entry) => entry.id === activeConversationId);
        if (!conversation || !messageHeader || !messagesArea) {
            return;
        }

        messageHeader.innerHTML = `
            <div class="flex items-center gap-4">
                <img src="${conversation.avatar}" class="w-10 h-10 rounded-full object-cover border border-gray-100" alt="${conversation.name}">
                <div>
                    <h3 class="font-bold text-slate-900 text-sm">${conversation.name}</h3>
                    <p class="text-xs text-gray-500 font-medium">${conversation.subtitle}</p>
                </div>
            </div>
            <div class="flex gap-2">
                <button class="p-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition" title="Call"><i data-lucide="phone" class="w-4 h-4"></i></button>
                <button class="p-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition" title="More Info"><i data-lucide="info" class="w-4 h-4"></i></button>
            </div>
        `;

        messagesArea.innerHTML = '';
        let lastDivider = '';
        conversation.thread.forEach((message) => {
            if (message.meta && message.meta !== lastDivider) {
                messagesArea.appendChild(buildDateDivider(message.meta));
                lastDivider = message.meta;
            }

            messagesArea.appendChild(buildMessageBubble(message, conversation.avatar));
        });

        messagesArea.scrollTop = messagesArea.scrollHeight;
        window.refreshLensWorksIcons();
    }

    async function hydrateConversationsFromApi() {
        if (!window.LensWorksApi || !window.LensWorksApi.messages) {
            markClientDataFailure('messages', 'messages offline');
            updateClientNotificationBadges();
            return;
        }

        const conversationsResult = await window.LensWorksApi.messages.listConversations();
        if (!conversationsResult.ok) {
            markClientDataFailure('messages', 'messages failed to load');
            updateClientNotificationBadges();
            return;
        }

        clearClientDataFailure('messages');

        const apiConversations = conversationsResult.payload?.data?.items || [];
        if (!apiConversations.length) {
            conversations = [];
            activeConversationId = null;
            renderEmptyConversationState('No messages yet.');
            updateClientNotificationBadges();
            return;
        }

        const mapped = await Promise.all(
            apiConversations.map(async (item) => {
                const messageResult = await window.LensWorksApi.messages.listMessages(item.id);
                const apiMessages = messageResult.ok ? messageResult.payload?.data?.items || [] : [];
                const thread = apiMessages.map((message) => ({
                    direction: message.senderName === item.participantName ? 'incoming' : 'outgoing',
                    body: message.body,
                    time: formatApiTime(message.sentAt),
                    meta: formatApiDay(message.sentAt)
                }));

                return {
                    id: item.id,
                    apiId: item.id,
                    name: item.participantName || 'LensWorks Contact',
                    subtitle: 'Live conversation',
                    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
                    status: 'online',
                    timeLabel: item.lastMessageAt ? formatApiTime(item.lastMessageAt) : 'Now',
                    preview: item.lastMessage || 'No messages yet.',
                    thread: thread.length
                        ? thread
                        : [{ direction: 'incoming', body: 'Conversation started.', time: formatTimestamp(), meta: 'Today' }]
                };
            })
        );

        conversations = mapped;
        if (requestedConversationId && conversations.some((entry) => entry.id === requestedConversationId)) {
            activeConversationId = requestedConversationId;
        } else {
            activeConversationId = conversations[0].id;
        }
        renderConversationList(conversationSearchInput ? conversationSearchInput.value : '');
        renderActiveConversation();
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.classList.remove('opacity-60', 'cursor-not-allowed');
        }
        if (chatTextarea) {
            chatTextarea.disabled = false;
            chatTextarea.placeholder = 'Write a message...';
        }
        updateClientNotificationBadges();
    }

    async function hydrateBookingsFromApi() {
        if (!window.LensWorksApi || !window.LensWorksApi.bookings) {
            markClientDataFailure('bookings', 'bookings offline');
            renderNoUpcomingBooking();
            return;
        }

        const result = await window.LensWorksApi.bookings.getMine();
        if (!result.ok) {
            markClientDataFailure('bookings', 'bookings failed to load');
            renderNoUpcomingBooking();
            return;
        }

        clearClientDataFailure('bookings');

        const items = result.payload?.data?.items || [];
        if (!items.length) {
            clientBookings = [];
            if (quickUpcomingCount) {
                quickUpcomingCount.textContent = '0';
            }
            renderNoUpcomingBooking();
            return;
        }

        clientBookings = items;
        applyQuickStats(items);
        setUpcomingBookingCard(getMostRelevantBooking(items));
    }

    async function hydrateClientPaymentsFromApi() {
        if (!window.LensWorksApi?.payments?.listMine) {
            markClientDataFailure('payments', 'payments offline');
            updateClientNotificationBadges();
            return;
        }

        const result = await window.LensWorksApi.payments.listMine();
        if (!result.ok) {
            markClientDataFailure('payments', 'payments failed to load');
            updateClientNotificationBadges();
            return;
        }

        clearClientDataFailure('payments');

        const items = result.payload?.data?.items || [];
        clientPayments = items;
        renderClientPaymentHistory(items);
        renderClientPaymentsTab(items);

        if (quickTotalSpent) {
            const totalSpent = items.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
            quickTotalSpent.textContent = formatMoney(totalSpent);
        }

        updateClientNotificationBadges();
    }

    async function hydrateVaultFromApi() {
        if (!vaultGrid || !window.LensWorksApi?.galleries?.listMine) {
            markClientDataFailure('vault', 'vault offline');
            return;
        }

        const result = await window.LensWorksApi.galleries.listMine();
        if (!result.ok) {
            markClientDataFailure('vault', 'vault failed to load');
            return;
        }

        clearClientDataFailure('vault');

        const galleries = result.payload?.data?.items || [];
        if (!galleries.length) {
            if (quickGalleriesCount) {
                quickGalleriesCount.textContent = '0';
            }

             vaultGrid.innerHTML = `
                <div class="col-span-full bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
                    No galleries yet. Your delivered sessions will appear here.
                    <div class="mt-4">
                        <a href="directory.html" class="inline-flex items-center justify-center px-4 py-2 rounded-full border border-slate-900 text-slate-900 text-xs font-semibold hover:bg-slate-900 hover:text-white transition">Book your first session</a>
                    </div>
                </div>
            `;
            return;
        }

        const cards = Array.from(vaultGrid.children).filter((entry) => !entry.dataset.vaultEmpty);
        cards.forEach((card, index) => {
            const gallery = galleries[index];
            if (!gallery) {
                return;
            }

            const title = card.querySelector('h3');
            if (title) {
                title.textContent = gallery.title || title.textContent;
            }

            const meta = card.querySelector('p.text-xs.text-gray-300.font-medium');
            if (meta) {
                const photoCount = Number(gallery.photoCount || 0);
                meta.textContent = `${photoCount} Photos`;
            }

            const cover = card.querySelector('.h-56 img');
            if (cover && gallery.coverImageUrl) {
                cover.src = gallery.coverImageUrl;
            }

            const openButton = card.querySelector('button[onclick*="gallery.html"]');
            if (openButton) {
                openButton.removeAttribute('onclick');
                openButton.addEventListener('click', () => {
                    window.location.href = `gallery.html?id=${encodeURIComponent(gallery.id)}`;
                });
            }
        });

        if (quickGalleriesCount) {
            quickGalleriesCount.textContent = String(galleries.length);
        }
    }

    async function hydrateHistoryFromApi() {
        if (!historyList) return;
        if (!window.LensWorksApi?.bookings?.getMine) {
            historyList.innerHTML = '<div class="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-sm text-gray-500">Could not load booking history.</div>';
            return;
        }
        const result = await window.LensWorksApi.bookings.getMine();
        if (!result.ok) {
            historyList.innerHTML = '<div class="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-sm text-gray-500">Could not load booking history.</div>';
            return;
        }
        const allBookings = result.payload?.data?.items || result.payload?.data?.bookings || [];
        clientPastBookings = allBookings.filter((b) => ['COMPLETED', 'CANCELED', 'CANCELLED'].includes(String(b.status || '').toUpperCase()));

        if (!clientPastBookings.length) {
            historyList.innerHTML = '<div class="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-sm text-gray-500">No past bookings yet. Your completed sessions will appear here.</div>';
            return;
        }

        historyList.innerHTML = clientPastBookings.map((booking) => {
            const status = String(booking.status || 'COMPLETED');
            const isCompleted = status === 'COMPLETED';
            const statusColor = isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600';
            const dateStr = booking.date
                ? new Date(booking.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : '—';
            return `
                <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-6 py-5">
                        <div class="flex items-start gap-4">
                            <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                <i data-lucide="camera" class="w-5 h-5 text-slate-600"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-slate-900">${booking.packageName || 'Session'}</h3>
                                <p class="text-sm text-gray-500 mt-0.5">${dateStr} &bull; ${booking.location || '—'}</p>
                                <p class="text-xs text-gray-400 mt-0.5 font-mono">Receipt: ${booking.receiptNumber || booking.id}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-4 flex-shrink-0">
                            <span class="text-sm font-black text-slate-900">${formatMoney(booking.total || 0)}</span>
                            <span class="text-xs font-bold px-2.5 py-1 rounded-full ${statusColor}">${status.charAt(0) + status.slice(1).toLowerCase()}</span>
                            ${isCompleted ? `<button class="text-xs font-semibold text-blue-600 hover:underline history-review-btn" data-booking-id="${booking.id}" data-vendor-slug="${booking.vendorSlug || ''}">Leave Review</button>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        historyList.querySelectorAll('.history-review-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const tab = document.querySelector('[data-target="reviews"]');
                if (reviewBookingSelect) {
                    reviewBookingSelect.value = btn.dataset.bookingId || '';
                }
                if (tab) tab.click();
            });
        });

        window.refreshLensWorksIcons();
    }

    async function hydrateReviewsTabFromApi() {
        if (!reviewsGivenList) return;

        // Load past bookings if not already loaded
        if (!clientPastBookings.length && window.LensWorksApi?.bookings?.getMine) {
            const result = await window.LensWorksApi.bookings.getMine();
            if (result.ok) {
                const all = result.payload?.data?.items || result.payload?.data?.bookings || [];
                clientPastBookings = all.filter((b) => ['COMPLETED'].includes(String(b.status || '').toUpperCase()));
            }
        }

        const completedBookings = clientPastBookings.filter((booking) => String(booking.status || '').toUpperCase() === 'COMPLETED');

        // Populate select with completed bookings
        if (reviewBookingSelect) {
            if (!completedBookings.length) {
                reviewBookingSelect.innerHTML = '<option value="">No completed sessions yet</option>';
            } else {
                reviewBookingSelect.innerHTML = '<option value="">Select a session...</option>' +
                    completedBookings.map((b) => {
                        const dateStr = b.date
                            ? new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : '';
                        return `<option value="${b.id}" data-slug="${b.vendorSlug || ''}">${b.packageName || 'Session'} — ${dateStr}</option>`;
                    }).join('');
            }
        }

        if (!window.LensWorksApi?.vendors?.getReviews) {
            clientSubmittedReviews = [];
            renderClientSubmittedReviews(clientSubmittedReviews);
            return;
        }

        const reviewerNames = getClientReviewAuthorCandidates();
        const vendorMetaBySlug = new Map();
        completedBookings.forEach((booking) => {
            if (booking.vendorSlug) {
                vendorMetaBySlug.set(booking.vendorSlug, booking.vendorName || booking.photographer || 'Vendor');
            }
        });

        const vendorSlugs = Array.from(vendorMetaBySlug.keys());
        if (!vendorSlugs.length || !reviewerNames.size) {
            clientSubmittedReviews = [];
            renderClientSubmittedReviews(clientSubmittedReviews);
            return;
        }

        const reviewResponses = await Promise.all(vendorSlugs.map(async (slug) => {
            const result = await window.LensWorksApi.vendors.getReviews(slug);
            if (!result.ok) {
                return [];
            }
            const reviews = result.payload?.data?.reviews || [];
            return reviews
                .filter((review) => reviewerNames.has(String(review.author || '').trim().toLowerCase()))
                .map((review) => ({
                    ...review,
                    vendorSlug: slug,
                    vendorName: vendorMetaBySlug.get(slug) || 'Vendor'
                }));
        }));

        clientSubmittedReviews = reviewResponses
            .flat()
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        renderClientSubmittedReviews(clientSubmittedReviews);
    }

    async function hydrateClientIdentityFromApi() {
        if (!window.LensWorksApi?.auth?.me) {
            applyClientIdentity();
            renderClientProfilePrompt();
            return;
        }

        const meResult = await window.LensWorksApi.auth.me();
        if (!meResult.ok) {
            window.location.replace('login.html');
            return;
        }
        activeClientUser = meResult.payload?.data?.user || null;
        const role = String(activeClientUser?.role || '').toUpperCase();
        if (role && role !== 'CLIENT') {
            window.location.replace('vendor-dashboard.html');
            return;
        }

        if (window.LensWorksApi?.account?.getSettings) {
            const settingsResult = await window.LensWorksApi.account.getSettings();
            if (settingsResult.ok) {
                activeClientProfile = settingsResult.payload?.data?.profile || null;
            }
        }

        hydrateReviewsTabFromApi();

        applyClientIdentity();
        renderClientProfilePrompt();
    }

    function filterVault() {
        if (!vaultGrid || !vaultSearchInput) {
            return;
        }

        const query = vaultSearchInput.value.trim().toLowerCase();
        const cards = Array.from(vaultGrid.children);
        let visibleCount = 0;

        cards.forEach((card) => {
            const text = card.textContent.toLowerCase();
            const visible = !query || text.includes(query);
            card.classList.toggle('hidden', !visible);
            if (visible) {
                visibleCount += 1;
            }
        });

        const existingEmpty = vaultGrid.querySelector('[data-vault-empty]');
        if (existingEmpty) {
            existingEmpty.remove();
        }

        if (!visibleCount) {
            const empty = document.createElement('div');
            empty.dataset.vaultEmpty = 'true';
            empty.className = 'col-span-full bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500';
            empty.textContent = 'No galleries match that search yet.';
            vaultGrid.appendChild(empty);
        }
    }

    function simulateButtonState(button, loadingText, completeText) {
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
            }, 1600);
        }, 900);
    }

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            setActiveTab(tab.dataset.target);
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

    if (chatTextarea) {
        chatTextarea.addEventListener('input', function handleInput() {
            this.style.height = 'auto';
            this.style.height = `${this.scrollHeight}px`;
        });
    }

    if (sendButton && chatTextarea) {
        sendButton.addEventListener('click', async () => {
            const body = chatTextarea.value.trim();
            if (!body) {
                chatTextarea.focus();
                return;
            }

            const conversation = conversations.find((entry) => entry.id === activeConversationId);
            if (!conversation) {
                return;
            }

            let nextMessage = {
                direction: 'outgoing',
                body,
                time: formatTimestamp(),
                meta: 'Today'
            };

            if (conversation.apiId) {
                const result = await window.LensWorksApi.messages.send(conversation.apiId, { body });
                if (result.ok) {
                    const payload = result.payload?.data?.message;
                    nextMessage = {
                        direction: 'outgoing',
                        body: payload?.body || body,
                        time: formatApiTime(payload?.sentAt),
                        meta: formatApiDay(payload?.sentAt)
                    };
                }
            }

            conversation.thread.push(nextMessage);
            conversation.preview = body;
            conversation.timeLabel = 'Now';
            chatTextarea.value = '';
            chatTextarea.style.height = 'auto';
            renderConversationList(conversationSearchInput ? conversationSearchInput.value : '');
            renderActiveConversation();
        });
    }

    if (conversationSearchInput) {
        conversationSearchInput.addEventListener('input', () => {
            renderConversationList(conversationSearchInput.value);
        });
    }

    if (paymentsSearchInput) {
        paymentsSearchInput.addEventListener('input', () => {
            renderClientPaymentsTab(clientPayments);
        });
    }

    if (paymentsTypeFilter) {
        paymentsTypeFilter.addEventListener('change', () => {
            renderClientPaymentsTab(clientPayments);
        });
    }

    if (paymentsStatusFilter) {
        paymentsStatusFilter.addEventListener('change', () => {
            renderClientPaymentsTab(clientPayments);
        });
    }

    if (paymentsExportCsvButton) {
        paymentsExportCsvButton.addEventListener('click', () => {
            exportPaymentsCsv();
        });
    }

    if (vaultSearchInput) {
        vaultSearchInput.addEventListener('input', filterVault);
    }

    if (upcomingMessageButton) {
        upcomingMessageButton.addEventListener('click', () => {
            setActiveTab('messages');
            if (!conversations.some((entry) => entry.id === activeConversationId)) {
                activeConversationId = conversations[0]?.id || null;
            }
            renderConversationList(conversationSearchInput ? conversationSearchInput.value : '');
            renderActiveConversation();
        });
    }

    if (upcomingManageButton) {
        upcomingManageButton.addEventListener('click', () => {
            showNotificationPanel('Manage Booking', [
                {
                    title: 'Open Messages',
                    body: 'Chat with your photographer about session details.',
                    actionLabel: 'Messages',
                    action: () => setActiveTab('messages')
                },
                {
                    title: 'Review Payments',
                    body: 'Check deposit and remaining balance details.',
                    actionLabel: 'Payments',
                    action: () => setActiveTab('payments')
                },
                {
                    title: 'Back to Booking',
                    body: 'Return to your booking timeline and actions.',
                    actionLabel: 'Upcoming',
                    action: () => setActiveTab('upcoming')
                }
            ]);
        });
    }

    if (notificationButton) {
        notificationButton.addEventListener('click', () => {
            showNotificationPanel('Notifications', buildClientNotifications());
        });
    }

    const directionButton = document.getElementById('upcoming-directions-btn');
    if (directionButton) {
        directionButton.addEventListener('click', () => {
            const target = activeBooking?.location || upcomingBookingLocation?.textContent || '';
            const destination = String(target).trim();

            if (!destination) {
                simulateButtonState(directionButton, 'Opening map...', 'Pinned');
                return;
            }

            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
            window.open(mapsUrl, '_blank', 'noopener,noreferrer');
        });
    }

    if (cancelBookingButton) {
        cancelBookingButton.addEventListener('click', async () => {
            if (!activeBooking || !activeBooking.id || !window.LensWorksApi?.bookings?.cancel) {
                return;
            }

            const confirmed = await showConfirmDialog({
                title: 'Cancel Booking',
                message: 'Cancel this booking? This action updates your active booking status.',
                confirmLabel: 'Yes, Cancel'
            });
            if (!confirmed) {
                return;
            }

            const originalMarkup = cancelBookingButton.innerHTML;
            cancelBookingButton.disabled = true;
            cancelBookingButton.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Canceling...';
            window.refreshLensWorksIcons();

            const result = await window.LensWorksApi.bookings.cancel(activeBooking.id);
            if (!result.ok) {
                cancelBookingButton.disabled = false;
                cancelBookingButton.innerHTML = originalMarkup;
                window.refreshLensWorksIcons();
                return;
            }

            activeBooking.status = 'CANCELED';
            setUpcomingBookingCard(activeBooking);
            hydrateHistoryFromApi();
            hydrateReviewsTabFromApi();

            cancelBookingButton.disabled = false;
            cancelBookingButton.innerHTML = originalMarkup;
            window.refreshLensWorksIcons();
        });
    }

    if (rescheduleButton) {
        rescheduleButton.addEventListener('click', async () => {
            if (!activeBooking || !activeBooking.id || !window.LensWorksApi?.bookings?.reschedule) {
                return;
            }

            const formData = await showRescheduleDialog(activeBooking);
            if (!formData) {
                return;
            }

            const nextDate = formData.date;
            const nextTime = formData.time;
            const nextLocation = formData.location;
            const reason = formData.reason;
            const originalMarkup = rescheduleButton.innerHTML;

            rescheduleButton.disabled = true;
            rescheduleButton.classList.add('pointer-events-none');
            rescheduleButton.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Updating...';
            window.refreshLensWorksIcons();

            const result = await window.LensWorksApi.bookings.reschedule(activeBooking.id, {
                date: nextDate,
                time: nextTime,
                location: nextLocation,
                reason
            });

            if (!result.ok) {
                rescheduleButton.disabled = false;
                rescheduleButton.classList.remove('pointer-events-none');
                rescheduleButton.innerHTML = originalMarkup;
                window.refreshLensWorksIcons();
                return;
            }

            const updatedBooking = result.payload?.data?.booking;
            if (updatedBooking) {
                activeBooking = {
                    ...activeBooking,
                    ...updatedBooking
                };
            } else {
                activeBooking.date = nextDate;
                activeBooking.time = nextTime;
                activeBooking.location = nextLocation;
                activeBooking.rescheduleReason = reason;
                activeBooking.status = 'PENDING';
            }

            setUpcomingBookingCard(activeBooking);
        });
    }

    if (payBalanceButton) {
        payBalanceButton.addEventListener('click', async () => {
            if (!activeBooking || !activeBooking.id || !window.LensWorksApi?.bookings?.payBalance) {
                simulateButtonState(payBalanceButton, 'Processing...', 'Balance Paid');
                return;
            }

            const original = payBalanceButton.innerHTML;
            payBalanceButton.disabled = true;
            payBalanceButton.classList.add('pointer-events-none');
            payBalanceButton.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Processing...';
            window.refreshLensWorksIcons();

            const result = await window.LensWorksApi.bookings.payBalance(activeBooking.id);
            if (!result.ok) {
                payBalanceButton.innerHTML = original;
                payBalanceButton.disabled = false;
                payBalanceButton.classList.remove('pointer-events-none');
                window.refreshLensWorksIcons();
                return;
            }

            const updatedBooking = result.payload?.data?.booking;
            if (updatedBooking) {
                activeBooking = {
                    ...activeBooking,
                    ...updatedBooking
                };
            } else {
                activeBooking.deposit = Number(activeBooking.total || 0);
            }

            setUpcomingBookingCard(activeBooking);
            hydrateClientPaymentsFromApi();
        });
    }

    if (bookNewSessionButton) {
        bookNewSessionButton.addEventListener('click', () => {
            window.location.href = 'directory.html';
        });
    }

    zipButtons.forEach((button) => {
        button.addEventListener('click', () => {
            simulateButtonState(button, 'Preparing...', 'Ready');
        });
    });

    shareButtons.forEach((button) => {
        button.addEventListener('click', () => {
            simulateButtonState(button, 'Copying...', 'Copied');
        });
    });

    // Star rating interaction for review form
    if (reviewStarsContainer) {
        reviewStarsContainer.querySelectorAll('.review-star-btn').forEach((star) => {
            star.addEventListener('click', () => {
                currentReviewRating = Number(star.dataset.value);
                reviewStarsContainer.dataset.rating = currentReviewRating;
                reviewStarsContainer.querySelectorAll('.review-star-btn').forEach((s) => {
                    const val = Number(s.dataset.value);
                    s.classList.toggle('text-yellow-400', val <= currentReviewRating);
                    s.classList.toggle('text-gray-300', val > currentReviewRating);
                });
            });
            star.addEventListener('mouseenter', () => {
                const hoverVal = Number(star.dataset.value);
                reviewStarsContainer.querySelectorAll('.review-star-btn').forEach((s) => {
                    const val = Number(s.dataset.value);
                    s.classList.toggle('text-yellow-300', val <= hoverVal);
                });
            });
            star.addEventListener('mouseleave', () => {
                reviewStarsContainer.querySelectorAll('.review-star-btn').forEach((s) => {
                    const val = Number(s.dataset.value);
                    s.classList.toggle('text-yellow-400', val <= currentReviewRating);
                    s.classList.toggle('text-yellow-300', false);
                    s.classList.toggle('text-gray-300', val > currentReviewRating);
                });
            });
        });
    }

    if (submitReviewBtn) {
        submitReviewBtn.addEventListener('click', async () => {
            if (!reviewStatusMsg) return;
            const selectedOption = reviewBookingSelect?.options[reviewBookingSelect.selectedIndex];
            const vendorSlug = selectedOption?.dataset.slug || '';
            const body = reviewBodyInput?.value.trim() || '';
            if (!vendorSlug) {
                reviewStatusMsg.textContent = 'Please select a session.';
                reviewStatusMsg.className = 'text-xs rounded-lg px-3 py-2 border mb-3 font-medium bg-red-50 text-red-700 border-red-200';
                reviewStatusMsg.classList.remove('hidden');
                return;
            }
            if (!currentReviewRating) {
                reviewStatusMsg.textContent = 'Please select a star rating.';
                reviewStatusMsg.className = 'text-xs rounded-lg px-3 py-2 border mb-3 font-medium bg-red-50 text-red-700 border-red-200';
                reviewStatusMsg.classList.remove('hidden');
                return;
            }
            if (body.length < 10) {
                reviewStatusMsg.textContent = 'Please write at least 10 characters.';
                reviewStatusMsg.className = 'text-xs rounded-lg px-3 py-2 border mb-3 font-medium bg-red-50 text-red-700 border-red-200';
                reviewStatusMsg.classList.remove('hidden');
                return;
            }
            reviewStatusMsg.classList.add('hidden');
            submitReviewBtn.disabled = true;
            submitReviewBtn.textContent = 'Submitting...';
            const result = await window.LensWorksApi?.vendors?.createReview?.(vendorSlug, { rating: currentReviewRating, body });
            submitReviewBtn.disabled = false;
            submitReviewBtn.innerHTML = '<i data-lucide="send" class="w-4 h-4"></i> Submit Review';
            window.refreshLensWorksIcons();
            if (result?.ok) {
                reviewStatusMsg.textContent = 'Review submitted! Thank you.';
                reviewStatusMsg.className = 'text-xs rounded-lg px-3 py-2 border mb-3 font-medium bg-green-50 text-green-700 border-green-200';
                reviewStatusMsg.classList.remove('hidden');
                if (reviewBodyInput) reviewBodyInput.value = '';
                if (reviewBookingSelect) reviewBookingSelect.value = '';
                currentReviewRating = 0;
                if (reviewStarsContainer) {
                    reviewStarsContainer.dataset.rating = '0';
                    reviewStarsContainer.querySelectorAll('.review-star-btn').forEach((s) => {
                        s.classList.remove('text-yellow-400', 'text-yellow-300');
                        s.classList.add('text-gray-300');
                    });
                }
                await hydrateReviewsTabFromApi();
            } else {
                reviewStatusMsg.textContent = result?.payload?.message || 'Could not submit review. Try again.';
                reviewStatusMsg.className = 'text-xs rounded-lg px-3 py-2 border mb-3 font-medium bg-red-50 text-red-700 border-red-200';
                reviewStatusMsg.classList.remove('hidden');
            }
        });
    }

    setActiveTab(initialTabKey);
    hydrateClientIdentityFromApi();
    updateClientNotificationBadges();
    renderEmptyConversationState('Loading conversations...');
    hydrateConversationsFromApi();
    hydrateBookingsFromApi();
    hydrateClientPaymentsFromApi();
    hydrateVaultFromApi();
    hydrateHistoryFromApi();
    hydrateReviewsTabFromApi();
    filterVault();

    if (dashboardMain) {
        dashboardMain.dataset.frontendEnhanced = 'true';
    }
});