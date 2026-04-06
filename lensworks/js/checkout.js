document.addEventListener('DOMContentLoaded', () => {
    const fallbackBooking = {
        photographer: 'LensWorks Photographer',
        packageName: 'Premium Session',
        packageDescription: '3 Hours • 150+ Photos • 2 Outfits',
        packagePrice: 450,
        addOns: [{ name: 'Extra Coverage Hour', price: 100 }],
        subtotal: 550,
        serviceFee: 27.5,
        total: 577.5,
        deposit: 115.5,
        date: '2026-10-14',
        time: '10:00 AM',
        location: 'Bahrain Bay Park, Manama'
    };

    const form = document.getElementById('checkout-form');
    const desktopBtn = document.getElementById('desktop-submit-btn');
    const mobileBtn = document.getElementById('mobile-submit-btn');
    const overlay = document.getElementById('success-overlay');
    const successCard = document.getElementById('success-card');
    const cardInput = document.getElementById('card-number');
    const expiryInput = document.getElementById('expiry-date');
    const bookingDate = document.getElementById('booking-date');
    const venueInput = document.getElementById('venue-address');
    const firstNameInput = document.getElementById('first-name');
    const lastNameInput = document.getElementById('last-name');
    const emailInput = document.getElementById('email-address');
    const noteInput = document.getElementById('photographer-note');
    const checkoutSummaryLines = document.getElementById('checkout-summary-lines');
    const checkoutFee = document.getElementById('checkout-service-fee');
    const checkoutTotal = document.getElementById('checkout-total-cost');
    const checkoutDeposit = document.getElementById('checkout-deposit-amount');
    const desktopBtnText = document.getElementById('desktop-submit-btn-text');
    const mobileBtnText = document.getElementById('mobile-submit-btn-text');
    const checkoutPhotographer = document.getElementById('checkout-photographer');
    const checkoutIntro = document.getElementById('checkout-intro');
    const successDeposit = document.getElementById('success-deposit');
    const successDateTime = document.getElementById('success-datetime');
    const successReceipt = document.getElementById('success-receipt');

    let draft = window.LensWorksStore.getCheckoutDraft() || window.LensWorksStore.getCart()[0] || fallbackBooking;
    const promo = window.LensWorksStore.getPromo();

    function applyPromoToDraft(currentDraft) {
        if (!promo) {
            return currentDraft;
        }

        const discount = Number(((currentDraft.total || 0) * promo.discount).toFixed(2));
        return {
            ...currentDraft,
            discount,
            total: Number(((currentDraft.total || 0) - discount).toFixed(2)),
            deposit: Number((((currentDraft.total || 0) - discount) * 0.2).toFixed(2))
        };
    }

    draft = applyPromoToDraft(draft);

    function formatLongDate(value) {
        try {
            return new Date(`${value}T10:00:00`).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return value;
        }
    }

    function selectedTime() {
        const checked = document.querySelector('input[name="time"]:checked');
        return checked ? `${checked.value}${checked.value.includes(':') ? '' : ''}` : draft.time;
    }

    function updateTimeSlotStyles() {
        document.querySelectorAll('input[name="time"]').forEach((radio) => {
            const slot = radio.nextElementSibling;
            slot.classList.toggle('border-slate-900', radio.checked);
            slot.classList.toggle('bg-slate-900', radio.checked);
            slot.classList.toggle('text-white', radio.checked);
            slot.classList.toggle('text-slate-600', !radio.checked && !radio.disabled);
            slot.classList.toggle('bg-white', !radio.checked && !radio.disabled);
        });
    }

    function syncDraftFromForm() {
        const liveDraft = {
            ...draft,
            date: bookingDate.value || draft.date,
            time: selectedTime(),
            location: venueInput.value.trim() || draft.location,
            firstName: firstNameInput.value.trim(),
            lastName: lastNameInput.value.trim(),
            email: emailInput.value.trim(),
            note: noteInput.value.trim()
        };

        window.LensWorksStore.setCheckoutDraft(liveDraft);
        draft = liveDraft;
    }

    function renderCheckoutSummary() {
        if (checkoutPhotographer) {
            checkoutPhotographer.textContent = draft.photographer;
        }

        if (checkoutIntro) {
            checkoutIntro.textContent = `Complete the steps below to secure your session with ${draft.photographer}.`;
        }

        checkoutSummaryLines.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-bold text-slate-900">${draft.packageName}</p>
                    <p class="text-xs text-gray-500 mt-1">${draft.packageDescription}</p>
                </div>
                <span class="font-medium text-slate-900">${window.LensWorksStore.formatCurrency(draft.packagePrice)}</span>
            </div>
            ${draft.addOns.map((item) => `
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-semibold text-slate-700 text-sm flex items-center gap-1"><i data-lucide="plus" class="w-3 h-3 text-blue-500"></i> ${item.name}</p>
                    </div>
                    <span class="text-sm font-medium text-slate-700">${window.LensWorksStore.formatCurrency(item.price)}</span>
                </div>`).join('')}
        `;

        checkoutFee.textContent = window.LensWorksStore.formatCurrency(draft.serviceFee);
        checkoutTotal.textContent = window.LensWorksStore.formatCurrency(draft.total);
        checkoutDeposit.textContent = window.LensWorksStore.formatCurrency(draft.deposit);
        desktopBtnText.innerHTML = `Pay ${window.LensWorksStore.formatCurrency(draft.deposit)} & Book <i data-lucide="lock" class="w-4 h-4"></i>`;
        mobileBtnText.innerHTML = `Pay ${window.LensWorksStore.formatCurrency(draft.deposit)} & Book <i data-lucide="lock" class="w-4 h-4"></i>`;
        successDeposit.textContent = window.LensWorksStore.formatCurrency(draft.deposit);
        successDateTime.textContent = `${formatLongDate(draft.date)} at ${draft.time}`;
        window.refreshLensWorksIcons();
    }

    function showCheckoutError(message) {
        let banner = document.getElementById('checkout-error-banner');
        if (!banner && form) {
            banner = document.createElement('div');
            banner.id = 'checkout-error-banner';
            banner.className = 'mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700';
            form.insertAdjacentElement('beforebegin', banner);
        }

        if (banner) {
            banner.textContent = message;
            banner.classList.remove('hidden');
        }
    }

    if (bookingDate) bookingDate.value = draft.date;
    if (venueInput) venueInput.value = draft.location || '';

    document.querySelectorAll('input[name="time"]').forEach((radio) => {
        radio.checked = radio.value === String(draft.time).replace(' AM', '').replace(' PM', '');
        radio.addEventListener('change', () => {
            updateTimeSlotStyles();
            syncDraftFromForm();
        });
    });

    updateTimeSlotStyles();

    [firstNameInput, lastNameInput, emailInput, venueInput, noteInput, bookingDate].forEach((field) => {
        if (field) {
            field.addEventListener('input', syncDraftFromForm);
        }
    });

    if (cardInput) {
        cardInput.addEventListener('input', (event) => {
            let value = event.target.value.replace(/\D/g, '');
            if (value.length > 16) value = value.substring(0, 16);

            let formatted = '';
            for (let index = 0; index < value.length; index += 1) {
                if (index > 0 && index % 4 === 0) formatted += ' ';
                formatted += value[index];
            }
            event.target.value = formatted;
        });
    }

    if (expiryInput) {
        expiryInput.addEventListener('input', (event) => {
            let value = event.target.value.replace(/\D/g, '');
            if (value.length > 4) value = value.substring(0, 4);

            event.target.value = value.length >= 2 ? `${value.substring(0, 2)}/${value.substring(2)}` : value;
        });
    }

    async function triggerSuccess(event) {
        event.preventDefault();
        syncDraftFromForm();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const originalDesktopText = desktopBtn.innerHTML;
        desktopBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Processing...';
        desktopBtn.disabled = true;
        if (mobileBtn) mobileBtn.disabled = true;
        window.refreshLensWorksIcons();

        const result = await window.LensWorksApi.checkout.confirm({
            booking: draft,
            customer: {
                firstName: firstNameInput.value.trim(),
                lastName: lastNameInput.value.trim(),
                email: emailInput.value.trim()
            }
        });

        desktopBtn.innerHTML = originalDesktopText;
        desktopBtn.disabled = false;
        if (mobileBtn) mobileBtn.disabled = false;

        if (!result.ok) {
            const status = Number(result.error?.status || 0);
            if (status === 401) {
                showCheckoutError('Please sign in before completing checkout. Redirecting to login...');
                window.setTimeout(() => {
                    window.location.href = 'login.html';
                }, 900);
                return;
            }

            const message = result.error?.payload?.message || 'Checkout failed. Please review details and try again.';
            showCheckoutError(message);
            return;
        }

        const receipt = result.payload?.data?.receiptNumber || window.LensWorksStore.createReceiptNumber();
        successReceipt.textContent = receipt;
        window.LensWorksStore.setLastBooking({ ...draft, receipt });
        window.LensWorksStore.clearCart();
        window.LensWorksStore.clearPromo();
        window.LensWorksStore.clearCheckoutDraft();

        overlay.classList.remove('hidden-fade');
        overlay.classList.add('visible-fade');

        setTimeout(() => {
            successCard.classList.remove('scale-95');
            successCard.classList.add('scale-100');
        }, 50);
    }

    if (form) {
        form.addEventListener('submit', triggerSuccess);
    }

    renderCheckoutSummary();
    syncDraftFromForm();
});