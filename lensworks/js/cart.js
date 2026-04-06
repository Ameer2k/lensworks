const PROMOS = {
    LENS20: 0.1
};

function showCartAlert(message, type = 'error') {
    const alert = document.getElementById('cart-alert');
    if (!alert) {
        return;
    }

    const isInfo = type === 'info';
    alert.textContent = message;
    alert.className = isInfo
        ? 'mb-5 rounded-xl border px-4 py-3 text-sm font-medium border-blue-200 bg-blue-50 text-blue-700'
        : 'mb-5 rounded-xl border px-4 py-3 text-sm font-medium border-red-200 bg-red-50 text-red-700';
}

function hideCartAlert() {
    const alert = document.getElementById('cart-alert');
    if (!alert) {
        return;
    }

    alert.className = 'hidden mb-5 rounded-xl border px-4 py-3 text-sm font-medium';
    alert.textContent = '';
}

function extractApiError(result, fallback) {
    return result?.error?.payload?.message || result?.error?.message || fallback;
}

function buildSummary(cartItems, promo) {
    const subtotal = cartItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    const serviceFee = cartItems.reduce((sum, item) => sum + Number(item.serviceFee || 0), 0);
    const discount = promo ? Number(((subtotal + serviceFee) * promo.discount).toFixed(2)) : 0;
    const total = Number((subtotal + serviceFee - discount).toFixed(2));
    const deposit = Number((total * 0.2).toFixed(2));

    return { subtotal, serviceFee, discount, total, deposit };
}

function renderCart() {
    const cartItems = window.LensWorksStore.getCart();
    const promo = window.LensWorksStore.getPromo();
    const itemsList = document.getElementById('cart-items-list');
    const summaryLines = document.getElementById('summary-lines');
    const heading = document.getElementById('cart-heading');
    const totalEl = document.getElementById('order-total');
    const promoMsg = document.getElementById('promo-msg');
    const discountRow = document.getElementById('discount-row');
    const checkoutCta = document.getElementById('checkout-cta');
    const depositCopy = document.getElementById('deposit-copy');

    if (!itemsList || !summaryLines || !heading || !totalEl || !checkoutCta || !depositCopy) {
        return;
    }

    heading.innerHTML = `Your Cart <span class="text-gray-400 font-normal text-lg">(${cartItems.length} item${cartItems.length === 1 ? '' : 's'})</span>`;

    if (cartItems.length === 0) {
        itemsList.innerHTML = `
            <div class="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center">
                <div class="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <i data-lucide="shopping-bag" class="w-6 h-6 text-gray-400"></i>
                </div>
                <h2 class="text-xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
                <p class="text-sm text-gray-500 mb-5">Add a package from a vendor profile before checking out.</p>
                <a href="directory.html" class="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-semibold hover:bg-slate-700 transition">
                    <i data-lucide="arrow-left" class="w-4 h-4"></i> Browse Packages
                </a>
            </div>`;
        summaryLines.innerHTML = '<div class="flex justify-between"><span>No items yet</span><span>$0.00</span></div>';
        discountRow.classList.add('hidden');
        totalEl.textContent = '$0.00';
        depositCopy.innerHTML = 'Add a package to continue to secure checkout.';
        checkoutCta.disabled = true;
        checkoutCta.classList.add('opacity-50', 'cursor-not-allowed');
        window.refreshLensWorksIcons();
        return;
    }

    itemsList.innerHTML = cartItems.map((item) => `
        <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex gap-4 fade-in" id="cart-item-${item.id}">
            <div class="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden border border-gray-100">
                <img src="${item.photographerImage}" class="w-full h-full object-cover" alt="${item.photographer}">
                <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <p class="font-bold text-base">${item.packageName} - ${item.photographer}</p>
                        <p class="text-sm text-gray-500 mt-0.5">${item.packageDescription}</p>
                    </div>
                    <button class="text-gray-400 hover:text-red-500 transition flex-shrink-0" onclick="removeItem('${item.id}')">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                    ${item.addOns.length ? item.addOns.map((addOn) => `<span class="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-100">+ ${addOn.name}</span>`).join('') : '<span class="text-xs text-gray-400">No add-ons selected</span>'}
                </div>
                <div class="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span class="flex items-center gap-1.5"><i data-lucide="calendar" class="w-4 h-4 text-gray-400"></i> ${item.date} • ${item.time}</span>
                    <span class="flex items-center gap-1.5"><i data-lucide="map-pin" class="w-4 h-4 text-gray-400"></i> ${item.location}</span>
                </div>
            </div>
            <div class="text-right flex-shrink-0">
                <p class="font-bold text-lg text-slate-900">${window.LensWorksStore.formatCurrency(item.total)}</p>
                <p class="text-xs text-gray-400 mt-0.5">Deposit: ${window.LensWorksStore.formatCurrency(item.deposit)}</p>
            </div>
        </div>`).join('');

    const summary = buildSummary(cartItems, promo);
    const lineItems = [];
    cartItems.forEach((item) => {
        lineItems.push(`<div class="flex justify-between"><span>${item.packageName}</span><span class="font-medium text-slate-900">${window.LensWorksStore.formatCurrency(item.packagePrice)}</span></div>`);
        item.addOns.forEach((addOn) => {
            lineItems.push(`<div class="flex justify-between"><span>${addOn.name}</span><span class="font-medium text-slate-900">${window.LensWorksStore.formatCurrency(addOn.price)}</span></div>`);
        });
    });
    lineItems.push(`<div class="border-t border-gray-100 pt-3 flex justify-between"><span>Platform Fee (5%)</span><span class="font-medium text-slate-900">${window.LensWorksStore.formatCurrency(summary.serviceFee)}</span></div>`);
    summaryLines.innerHTML = lineItems.join('');

    if (promo) {
        discountRow.classList.remove('hidden');
        discountRow.innerHTML = `<span>Promo (${promo.code})</span><span class="font-medium">-${window.LensWorksStore.formatCurrency(summary.discount)}</span>`;
        promoMsg.textContent = `Promo code applied - ${Math.round(promo.discount * 100)}% off!`;
        promoMsg.className = 'text-xs mt-2 text-green-600 font-medium';
    } else {
        discountRow.classList.add('hidden');
        promoMsg.classList.add('hidden');
    }

    totalEl.textContent = window.LensWorksStore.formatCurrency(summary.total);
    depositCopy.innerHTML = `Only the deposit of <strong>${window.LensWorksStore.formatCurrency(summary.deposit)}</strong> is charged today. The remaining balance is due 48 hours before your session.`;
    checkoutCta.disabled = false;
    checkoutCta.classList.remove('opacity-50', 'cursor-not-allowed');
    window.LensWorksStore.setCheckoutDraft(cartItems[0]);
    window.refreshLensWorksIcons();
}

async function removeItem(id) {
    const response = await window.LensWorksApi.cart.deleteItem(id);
    if (!response.ok) {
        if (response.error?.status === 401) {
            showCartAlert('Please log in again to update your cart.', 'info');
            window.setTimeout(() => {
                window.location.href = 'login.html';
            }, 700);
            return;
        }

        showCartAlert(extractApiError(response, 'Could not remove this item right now. Please try again.'));
        return;
    }

    hideCartAlert();
    window.LensWorksStore.removeCartItem(id);
    renderCart();
}

async function applyPromo(event) {
    event.preventDefault();
    const input = document.getElementById('promo-input');
    const promoMsg = document.getElementById('promo-msg');
    const code = input.value.trim().toUpperCase();

    if (PROMOS[code]) {
        const response = await window.LensWorksApi.cart.applyPromo(code);
        if (!response.ok) {
            if (response.error?.status === 401) {
                showCartAlert('Please log in to apply promo codes.', 'info');
                window.setTimeout(() => {
                    window.location.href = 'login.html';
                }, 700);
                return;
            }

            promoMsg.textContent = extractApiError(response, 'Promo could not be applied right now.');
            promoMsg.className = 'text-xs mt-2 text-red-500 font-medium';
            promoMsg.classList.remove('hidden');
            return;
        }

        hideCartAlert();
        window.LensWorksStore.setPromo({ code, discount: PROMOS[code] });
        renderCart();
        input.value = '';
        return;
    }

    promoMsg.textContent = 'Invalid promo code.';
    promoMsg.className = 'text-xs mt-2 text-red-500 font-medium';
    promoMsg.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    const checkoutCta = document.getElementById('checkout-cta');

    window.LensWorksApi.cart.get().then((response) => {
        if (response.ok) {
            hideCartAlert();
            return;
        }

        if (response.error?.status === 401) {
            showCartAlert('Your session expired. Please log in to access your cart.', 'info');
            return;
        }

        showCartAlert(extractApiError(response, 'Could not sync cart from the server. Showing saved local cart.'));
    });

    if (checkoutCta) {
        checkoutCta.addEventListener('click', () => {
            const cart = window.LensWorksStore.getCart();
            if (!cart.length) {
                return;
            }

            window.LensWorksStore.setCheckoutDraft(cart[0]);
            window.location.href = 'checkout.html';
        });
    }

    renderCart();
});