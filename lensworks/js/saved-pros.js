document.addEventListener('DOMContentLoaded', () => {
    const favoriteStorageKey = 'lensworks-directory-favorites';
    const grid = document.getElementById('saved-pros-grid');
    const status = document.getElementById('saved-pros-status');
    const count = document.getElementById('saved-pros-count');
    let savedVendors = [];

    function setStatus(message, tone = 'neutral') {
        if (!status) {
            return;
        }

        if (!message) {
            status.className = 'hidden mb-6 rounded-xl border px-4 py-3 text-sm font-medium';
            status.textContent = '';
            return;
        }

        if (tone === 'error') {
            status.className = 'mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-medium';
        } else {
            status.className = 'mb-6 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm font-medium';
        }

        status.textContent = message;
    }

    function readFavorites() {
        try {
            const raw = window.localStorage.getItem(favoriteStorageKey);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function renderEmpty(message) {
        if (!grid) {
            return;
        }

        grid.innerHTML = `
            <div class="col-span-full bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center">
                <div class="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <i data-lucide="heart" class="w-6 h-6 text-gray-400"></i>
                </div>
                <h2 class="text-xl font-bold text-slate-900 mb-2">No saved pros yet</h2>
                <p class="text-sm text-gray-500 mb-5">${message}</p>
                <a href="directory.html" class="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-semibold hover:bg-slate-700 transition">
                    <i data-lucide="search" class="w-4 h-4"></i> Explore Directory
                </a>
            </div>
        `;

        if (count) {
            count.textContent = '0 saved';
        }

        window.refreshLensWorksIcons();
    }

    function renderSavedVendors(items) {
        if (!grid) {
            return;
        }

        if (!items.length) {
            renderEmpty('Favorite vendors from the directory to see them here.');
            return;
        }

        savedVendors = items;

        if (count) {
            count.textContent = `${items.length} saved`;
        }

        grid.innerHTML = items.map((vendor) => `
            <article class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
                <div class="relative h-52 bg-gray-100 overflow-hidden">
                    <img src="${escapeHtml(vendor.coverImageUrl || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200&auto=format&fit=crop')}" alt="${escapeHtml(vendor.displayName || 'Vendor')} cover" class="w-full h-full object-cover">
                    <span class="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">Saved</span>
                </div>
                <div class="p-5">
                    <div class="flex items-center justify-between gap-4 mb-2">
                        <h3 class="text-lg font-bold text-slate-900">${escapeHtml(vendor.displayName || 'Vendor')}</h3>
                        <span class="text-sm font-semibold text-slate-700">$${Number(vendor.startsAt || 0).toLocaleString()}/hr</span>
                    </div>
                    <p class="text-sm text-gray-500 mb-4">${escapeHtml(vendor.tagline || 'Professional photographer')}</p>
                    <div class="flex items-center justify-between text-xs text-gray-500 mb-5">
                        <span class="flex items-center gap-1"><i data-lucide="map-pin" class="w-3.5 h-3.5"></i> ${escapeHtml(vendor.city || 'Location pending')}</span>
                        <span class="flex items-center gap-1"><i data-lucide="star" class="w-3.5 h-3.5 text-yellow-500 fill-yellow-500"></i> ${Number(vendor.rating || 0).toFixed(1)} (${Number(vendor.reviewCount || 0)})</span>
                    </div>
                    <div class="flex gap-2">
                        <a href="vendor-profile.html?vendor=${encodeURIComponent(vendor.slug || vendor.id || '')}" class="flex-1 text-center bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition">View Profile</a>
                        <button type="button" data-remove-id="${escapeHtml(vendor.id || '')}" class="px-3 py-2.5 rounded-lg border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 transition">
                            <i data-lucide="heart-off" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </article>
        `).join('');

        window.refreshLensWorksIcons();
    }

    async function hydrateSavedPros() {
        const favorites = readFavorites();
        if (!favorites.length) {
            setStatus('Save vendors from directory hearts to build your shortlist.', 'neutral');
            renderEmpty('Use the heart icon on directory cards.');
            return;
        }

        if (!window.LensWorksApi?.vendors?.list) {
            setStatus('Vendor API unavailable. Please retry once backend is running.', 'error');
            renderEmpty('Favorites cannot be loaded right now.');
            return;
        }

        const result = await window.LensWorksApi.vendors.list();
        if (!result.ok) {
            setStatus('Failed to load vendor data. Try refreshing.', 'error');
            renderEmpty('Favorites cannot be loaded right now.');
            return;
        }

        setStatus('');
        const items = result.payload?.data?.items || [];
        const favoriteSet = new Set(favorites);
        const matched = items.filter((vendor) => favoriteSet.has(vendor.id) || favoriteSet.has(vendor.slug));
        renderSavedVendors(matched);
    }

    if (grid) {
        grid.addEventListener('click', (event) => {
            const removeButton = event.target.closest('[data-remove-id]');
            if (!removeButton) {
                return;
            }

            const vendorId = removeButton.dataset.removeId;
            if (!vendorId) {
                return;
            }

            const next = readFavorites().filter((entry) => entry !== vendorId);
            window.localStorage.setItem(favoriteStorageKey, JSON.stringify(next));
            const nextItems = savedVendors.filter((entry) => entry.id !== vendorId);
            renderSavedVendors(nextItems);
        });
    }

    hydrateSavedPros();
});
