document.addEventListener('DOMContentLoaded', () => {
    const filterBtn = document.getElementById('mobile-filter-btn');
    const sidebar = document.getElementById('filter-sidebar');
    const styleTags = Array.from(document.querySelectorAll('aside .style-chip'));
    const resetBtn = document.getElementById('filters-reset-btn');
    const priceSlider = document.getElementById('price-range-filter');
    const priceDisplay = document.getElementById('price-display');
    const locationInput = document.getElementById('location-filter');
    const travelCheckbox = document.getElementById('travel-filter');
    const categoryCheckboxes = Array.from(document.querySelectorAll('aside input[type="checkbox"][data-category]'));
    const resultsCount = document.getElementById('results-count');
    const mobileResultsCount = document.getElementById('mobile-results-count');
    const sortSelect = document.getElementById('directory-sort');
    const activeFilterChips = document.getElementById('active-filter-chips');
    const clearActiveFiltersBtn = document.getElementById('active-filters-clear');
    const checkDatesBtn = document.getElementById('check-dates-btn');
    const checkDatesLabel = document.getElementById('check-dates-label');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const cardsGrid = document.querySelector('.grid.grid-cols-1.md\:grid-cols-2.xl\:grid-cols-3.gap-6');
    const cards = cardsGrid ? Array.from(cardsGrid.children) : [];
    const mapPanel = document.getElementById('map-view-panel');
    const liveMapElement = document.getElementById('directory-live-map');
    const mapPins = mapPanel ? Array.from(mapPanel.querySelectorAll('.absolute .cursor-pointer')).slice(0, cards.length) : [];
    const mapPinWrappers = mapPins.map((pin) => pin.parentElement);
    const mapContainer = mapPanel ? mapPanel.querySelector('.w-full.h-full.bg-gray-100.relative.flex.items-center.justify-center') : null;
    const mapStatusLabel = mapPanel ? mapPanel.querySelector('p.absolute.bottom-4.left-4') : null;
    const mapZoomControls = mapPanel ? Array.from(mapPanel.querySelectorAll('button')).filter((button) => button.textContent.trim() === '+' || button.textContent.trim() === '−' || button.textContent.trim() === '-') : [];
    const emptyStateId = 'directory-empty-state';
    const favoriteStorageKey = 'lensworks-directory-favorites';
    const LOAD_MORE_STEP = 6;
    const favorites = new Set(JSON.parse(window.localStorage.getItem(favoriteStorageKey) || '[]'));
    let selectedDate = '';
    let visibleLimit = 9;

    const fallbackVendorMeta = [
        { category: 'Weddings', travel: true, badge: 'Top Rated', lat: 26.2259, lng: 50.5862, responseHours: 1, completedShoots: 286, availability: '2 slots this week', verified: true },
        { category: 'Commercial & Ads', travel: false, badge: 'High Demand', lat: 26.1307, lng: 50.5554, responseHours: 2, completedShoots: 214, availability: 'Limited slots', verified: true },
        { category: 'Portraits & Fashion', travel: false, badge: '', lat: 26.2571, lng: 50.6119, responseHours: 3, completedShoots: 345, availability: 'Open this week', verified: true },
        { category: 'Events & Parties', travel: true, badge: 'Fast Responder', lat: 26.2146, lng: 50.5852, responseHours: 1, completedShoots: 178, availability: 'Next day available', verified: true },
        { category: 'Real Estate', travel: true, badge: '', lat: 26.2361, lng: 50.5481, responseHours: 4, completedShoots: 162, availability: 'Open this week', verified: true }
    ];
    const fallbackSlugs = ['sarah-jenkins', 'david-chen', 'elena-rostova', 'studio-7', 'marcus-field'];

    function fallbackGeoByIndex(index) {
        const base = fallbackVendorMeta[index % fallbackVendorMeta.length] || fallbackVendorMeta[0];
        if (index < fallbackVendorMeta.length) {
            return base;
        }

        const offset = (index - fallbackVendorMeta.length + 1) * 0.012;
        return {
            ...base,
            lat: Number((base.lat + offset).toFixed(6)),
            lng: Number((base.lng - offset * 0.6).toFixed(6))
        };
    }

    function createCardElement() {
        if (!cards.length) {
            return null;
        }

        const clone = cards[0].cloneNode(true);
        clone.classList.remove('hidden');
        const heartIcon = clone.querySelector('i[data-lucide="heart"]');
        if (heartIcon) {
            heartIcon.classList.remove('fill-red-500', 'text-red-500');
            heartIcon.classList.add('text-white');
        }
        return clone;
    }

    function createStaticPin(meta) {
        const pinLayer = mapPanel ? mapPanel.querySelector('.relative.z-10.w-full.h-full') : null;
        if (!pinLayer) {
            return null;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'absolute';
        const top = 24 + ((Math.abs(Math.round(meta.lat * 100)) % 56));
        const left = 20 + ((Math.abs(Math.round(meta.lng * 100)) % 62));
        wrapper.style.top = `${top}%`;
        wrapper.style.left = `${left}%`;
        wrapper.dataset.vendorId = meta.id;

        const pin = document.createElement('div');
        pin.className = 'bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg cursor-pointer hover:bg-indigo-600 transition';
        pin.textContent = `$${meta.price}/hr`;
        pin.onclick = () => {
            window.location.href = `vendor-profile.html?vendor=${encodeURIComponent(meta.slug)}`;
        };

        const arrow = document.createElement('div');
        arrow.className = 'w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1';

        wrapper.append(pin, arrow);
        pinLayer.appendChild(wrapper);
        return { wrapper, pin };
    }

    function registerCardInteractions(card) {
        if (!card) {
            return;
        }

        const heartButton = card.querySelector('button i[data-lucide="heart"]')?.closest('button');
        card.addEventListener('mouseenter', () => {
            setActivePin(card.dataset.vendorId);
        });

        if (heartButton) {
            heartButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const vendorId = card.dataset.vendorId;
                if (favorites.has(vendorId)) {
                    favorites.delete(vendorId);
                } else {
                    favorites.add(vendorId);
                }
                updateFavoriteUI();
            });
        }
    }

    function registerPinInteractions(wrapper, index) {
        if (!wrapper) {
            return;
        }

        wrapper.addEventListener('mouseenter', () => {
            setActivePin(wrapper.dataset.vendorId);
        });

        wrapper.addEventListener('click', () => {
            const targetCard = cards[index];
            if (targetCard && !targetCard.classList.contains('hidden')) {
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetCard.classList.add('ring-2', 'ring-indigo-500');
                setTimeout(() => {
                    targetCard.classList.remove('ring-2', 'ring-indigo-500');
                }, 900);
            }
        });
    }

    function ensureUiCapacity(length) {
        while (cards.length < length) {
            const nextCard = createCardElement();
            if (!nextCard || !cardsGrid) {
                break;
            }

            cardsGrid.appendChild(nextCard);
            cards.push(nextCard);
            registerCardInteractions(nextCard);

            const fallback = fallbackGeoByIndex(cards.length - 1);
            const pinData = createStaticPin({
                id: `pin-${cards.length - 1}`,
                slug: `vendor-${cards.length - 1}`,
                price: 120,
                lat: fallback.lat,
                lng: fallback.lng
            });
            if (pinData?.pin && pinData?.wrapper) {
                mapPins.push(pinData.pin);
                mapPinWrappers.push(pinData.wrapper);
                registerPinInteractions(pinData.wrapper, cards.length - 1);
            }
        }
    }

    function slugify(value) {
        return String(value || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || `vendor-${Date.now()}`;
    }

    function normalizeText(value) {
        return String(value || '').toLowerCase().trim();
    }

    function normalizeCategoryToken(value) {
        return normalizeText(value)
            .replace(/&/g, 'and')
            .replace(/\//g, ' ')
            .replace(/[^a-z0-9\s]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function categoryMatches(selectedCategory, vendorCategory) {
        const selected = normalizeCategoryToken(selectedCategory);
        const current = normalizeCategoryToken(vendorCategory);

        if (!selected || !current) {
            return false;
        }

        if (selected === current || selected.includes(current) || current.includes(selected)) {
            return true;
        }

        if (selected.includes('portrait') && current.includes('fashion')) {
            return true;
        }

        if (selected.includes('fashion') && current.includes('portrait')) {
            return true;
        }

        return false;
    }

    function normalizeStyleToken(value) {
        return normalizeText(value)
            .replace(/&/g, 'and')
            .replace(/\//g, ' ')
            .replace(/[^a-z0-9\s]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function styleMatches(selectedStyle, vendorStyles) {
        const wanted = normalizeStyleToken(selectedStyle);
        if (!wanted) {
            return true;
        }

        const stylePool = (Array.isArray(vendorStyles) ? vendorStyles : []).map((entry) => normalizeStyleToken(entry));
        if (!stylePool.length) {
            return false;
        }

        return stylePool.some((entry) => entry.includes(wanted) || wanted.includes(entry));
    }

    function deriveCategory(meta = {}) {
        const knownCategories = [
            'Weddings',
            'Commercial & Ads',
            'Portraits & Fashion',
            'Real Estate',
            'Events & Parties'
        ];

        const source = [meta.tagline, ...(Array.isArray(meta.styles) ? meta.styles : []), meta.category]
            .map((entry) => normalizeText(entry))
            .join(' ');

        if (!source) {
            return 'Weddings';
        }

        if (source.includes('wedding')) {
            return 'Weddings';
        }
        if (source.includes('commercial') || source.includes('brand') || source.includes('ads') || source.includes('advert')) {
            return 'Commercial & Ads';
        }
        if (source.includes('portrait') || source.includes('fashion') || source.includes('editorial')) {
            return 'Portraits & Fashion';
        }
        if (source.includes('estate') || source.includes('property') || source.includes('interior')) {
            return 'Real Estate';
        }
        if (source.includes('event') || source.includes('party')) {
            return 'Events & Parties';
        }

        return knownCategories.includes(meta.category) ? meta.category : 'Weddings';
    }

    let vendorMeta = cards.map((card, index) => {
        const heading = card.querySelector('h3');
        const name = heading ? heading.childNodes[0].textContent.trim() : `Vendor ${index + 1}`;
        const details = card.querySelector('p.text-sm.text-gray-500');
        const ratingText = card.querySelector('.font-bold')?.textContent || '4.8';
        const reviewsText = card.querySelector('.font-bold span')?.textContent || '(0)';
        const cityText = card.querySelector('.text-gray-500 i[data-lucide="map-pin"]')?.parentElement?.textContent || 'Manama';
        const priceText = card.querySelector('.font-bold.text-lg')?.textContent || '$100';
        const badgeText = card.querySelector('.absolute.top-3.left-3')?.textContent.trim() || '';
        const image = card.querySelector('img');
        const avatar = card.querySelector('.w-10.h-10.rounded-full');
        const fallback = fallbackVendorMeta[index] || fallbackVendorMeta[0];

        return {
            id: slugify(name),
            slug: fallbackSlugs[index] || slugify(name),
            name,
            category: details ? details.textContent.trim() : fallback.category,
            location: cityText.replace(/\s+/g, ' ').trim(),
            price: Number(priceText.replace(/[^\d.]/g, '')) || 100,
            rating: Number(ratingText.replace(/[^\d.]/g, '')) || 4.8,
            reviews: Number(reviewsText.replace(/[^\d]/g, '')) || 0,
            styles: ['Cinematic'],
            travel: fallback.travel,
            badge: badgeText || fallback.badge,
            responseHours: fallback.responseHours,
            completedShoots: fallback.completedShoots,
            availability: fallback.availability,
            verified: fallback.verified,
            lat: fallback.lat,
            lng: fallback.lng,
            coverImageUrl: image ? image.src : '',
            avatarUrl: avatar ? avatar.src : ''
        };
    });

    let leafletMap = null;
    const markerByVendorId = new Map();
    const activeMarkerByVendorId = new Map();

    function bindCardIdentity() {
        cards.forEach((card, index) => {
            const meta = vendorMeta[index];
            if (!meta) {
                return;
            }
            card.dataset.vendorId = meta.id;

            if (mapPinWrappers[index]) {
                mapPinWrappers[index].dataset.vendorId = meta.id;
            }
        });
    }

    function hydrateCard(card, meta) {
        if (!card || !meta) {
            return;
        }

        const heading = card.querySelector('h3');
        if (heading) {
            const icon = heading.querySelector('i');
            heading.innerHTML = '';
            heading.append(document.createTextNode(`${meta.name} `));
            if (icon) {
                heading.append(icon);
            }
        }

        const roleText = card.querySelector('p.text-sm.text-gray-500');
        if (roleText) {
            roleText.textContent = meta.category;
        }

        const ratingBlock = card.querySelector('.flex.items-center.gap-1.font-bold');
        if (ratingBlock) {
            const starIcon = ratingBlock.querySelector('i');
            const reviews = ratingBlock.querySelector('span');
            ratingBlock.innerHTML = '';
            if (starIcon) {
                ratingBlock.append(starIcon);
            }
            ratingBlock.append(document.createTextNode(` ${meta.rating.toFixed(1)} `));
            const reviewsSpan = reviews || document.createElement('span');
            reviewsSpan.className = 'text-gray-400 font-normal';
            reviewsSpan.textContent = `(${meta.reviews})`;
            ratingBlock.append(reviewsSpan);
        }

        const locationBlock = card.querySelector('.flex.items-center.gap-1.text-gray-500');
        if (locationBlock) {
            const pin = locationBlock.querySelector('i');
            locationBlock.innerHTML = '';
            if (pin) {
                locationBlock.append(pin);
            }
            locationBlock.append(document.createTextNode(` ${meta.location}`));
        }

        const startingPrice = card.querySelector('.font-bold.text-lg');
        if (startingPrice) {
            startingPrice.innerHTML = `$${Number(meta.price).toLocaleString()}<span class="text-sm text-gray-400 font-normal">/hr</span>`;
        }

        const badge = card.querySelector('.absolute.top-3.left-3');
        if (badge) {
            if (meta.badge) {
                badge.textContent = meta.badge;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }

        const coverImage = card.querySelector('.relative.h-60 img');
        if (coverImage && meta.coverImageUrl) {
            coverImage.src = meta.coverImageUrl;
            coverImage.alt = `${meta.name} portfolio`;
        }

        const avatarImage = card.querySelector('.w-10.h-10.rounded-full');
        if (avatarImage && meta.avatarUrl) {
            avatarImage.src = meta.avatarUrl;
            avatarImage.alt = `${meta.name} avatar`;
        }

        const viewButton = card.querySelector('button.bg-slate-900.text-white');
        if (viewButton) {
            viewButton.onclick = () => {
                window.location.href = `vendor-profile.html?vendor=${encodeURIComponent(meta.slug)}`;
            };
        }

        const cardBody = card.querySelector('.p-5.flex.flex-col.flex-1');
        const footer = card.querySelector('.mt-auto.pt-4.border-t.border-gray-100.flex.items-center.justify-between');
        if (!cardBody || !footer) {
            return;
        }

        let trustStrip = card.querySelector('[data-role="trust-strip"]');
        if (!trustStrip) {
            trustStrip = document.createElement('div');
            trustStrip.dataset.role = 'trust-strip';
            trustStrip.className = 'mt-2 mb-3 grid grid-cols-2 gap-2 text-[11px]';
            footer.before(trustStrip);
        }

        trustStrip.innerHTML = `
            <div class="bg-slate-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600"><span class="font-bold text-slate-900">${meta.responseHours}h</span> response</div>
            <div class="bg-slate-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600"><span class="font-bold text-slate-900">${meta.completedShoots}</span> completed</div>
            <div class="bg-slate-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600">${meta.availability}</div>
            <div class="bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1.5 text-emerald-700 font-semibold flex items-center gap-1"><i data-lucide="badge-check" class="w-3.5 h-3.5"></i> Verified</div>
        `;
    }

    function deriveResponseHours(vendor) {
        if (Number(vendor.reviewCount || 0) >= 180) {
            return 1;
        }
        if (Number(vendor.rating || 0) >= 4.9) {
            return 2;
        }
        if (Number(vendor.rating || 0) >= 4.7) {
            return 3;
        }
        return 4;
    }

    function deriveAvailability(vendor) {
        const startsAt = Number(vendor.startsAt || 0);
        if (startsAt <= 130) {
            return 'Open this week';
        }
        if (startsAt <= 220) {
            return '2 slots this week';
        }
        return 'Limited slots';
    }

    async function loadVendorMetaFromApi() {
        const response = await window.LensWorksApi.vendors.list();
        if (!response.ok) {
            return;
        }

        const apiItems = response.payload?.data?.items;
        if (!Array.isArray(apiItems) || !apiItems.length) {
            return;
        }

        ensureUiCapacity(apiItems.length);

        vendorMeta = cards.map((_, index) => {
            const apiVendor = apiItems[index];
            const fallback = vendorMeta[index] || fallbackGeoByIndex(index);

            if (!apiVendor) {
                return {
                    ...fallback,
                    id: `${fallback.id || `vendor-${index}`}-hidden-${index}`
                };
            }

            return {
                ...fallback,
                id: apiVendor.id || apiVendor.slug || fallback.id,
                slug: apiVendor.slug || fallback.slug,
                name: apiVendor.displayName || fallback.name,
                category: deriveCategory({
                    tagline: apiVendor.tagline,
                    styles: apiVendor.styles,
                    category: fallback.category
                }),
                location: apiVendor.city || fallback.location,
                price: Number(apiVendor.startsAt || fallback.price || 0),
                rating: Number(apiVendor.rating || fallback.rating || 0),
                reviews: Number(apiVendor.reviewCount || fallback.reviews || 0),
                styles: Array.isArray(apiVendor.styles) ? apiVendor.styles : fallback.styles,
                responseHours: deriveResponseHours(apiVendor),
                completedShoots: Math.max(30, Math.round(Number(apiVendor.reviewCount || fallback.reviews || 0) * 2.3)),
                availability: deriveAvailability(apiVendor),
                verified: true,
                coverImageUrl: apiVendor.coverImageUrl || fallback.coverImageUrl,
                avatarUrl: apiVendor.avatarUrl || fallback.avatarUrl
            };
        });

        cards.forEach((card, index) => {
            const meta = vendorMeta[index];
            if (!meta) {
                return;
            }
            hydrateCard(card, meta);
        });

        bindCardIdentity();
    }

    bindCardIdentity();
    cards.forEach((card, index) => {
        hydrateCard(card, vendorMeta[index]);
    });

    function initProviderReadyMap() {
        if (!mapPanel || !mapContainer) {
            return;
        }

        const provider = String(window.LENSWORKS_MAP_PROVIDER || 'auto').toLowerCase();
        const mapboxToken = window.LENSWORKS_MAPBOX_TOKEN;
        const hasMapboxRuntime = Boolean(window.mapboxgl && provider === 'mapbox' && mapboxToken);
        const hasLeafletRuntime = Boolean(window.L && liveMapElement && (provider === 'leaflet' || provider === 'auto'));

        if (hasLeafletRuntime) {
            initializeLeafletMap();
            mapStatusLabel.textContent = 'Map provider active: Leaflet + OpenStreetMap';
            mapStatusLabel.classList.remove('text-gray-500');
            mapStatusLabel.classList.add('text-emerald-700');
            return;
        }

        if (hasMapboxRuntime) {
            mapStatusLabel.textContent = 'Map provider active: Mapbox preview mode';
            mapStatusLabel.classList.remove('text-gray-500');
            mapStatusLabel.classList.add('text-emerald-700');
            return;
        }

        mapStatusLabel.textContent = 'Preview map mode. Set LENSWORKS_MAP_PROVIDER and map SDK to enable live provider.';
        mapStatusLabel.classList.remove('text-gray-500');
        mapStatusLabel.classList.add('text-slate-700');
    }

    function markerHtml(meta, active = false) {
        const base = active ? 'background:#4f46e5;' : 'background:#0f172a;';
        return `<div style="${base}color:#fff;padding:6px 10px;border-radius:999px;font-size:11px;font-weight:700;box-shadow:0 6px 18px rgba(15,23,42,0.25);border:2px solid rgba(255,255,255,0.85);">$${meta.price}/hr</div>`;
    }

    function initializeLeafletMap() {
        if (!window.L || !liveMapElement || leafletMap) {
            return;
        }

        liveMapElement.classList.remove('hidden');
        const placeholderLayer = mapPanel.querySelector('.absolute.inset-0');
        if (placeholderLayer) {
            placeholderLayer.classList.add('hidden');
        }
        const pinLayer = mapPanel.querySelector('.relative.z-10.w-full.h-full');
        if (pinLayer) {
            pinLayer.classList.add('hidden');
        }
        mapZoomControls.forEach((button) => {
            button.classList.add('hidden');
        });

        leafletMap = window.L.map(liveMapElement, {
            zoomControl: true,
            scrollWheelZoom: true
        }).setView([26.2235, 50.5876], 11);

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(leafletMap);

        vendorMeta.forEach((meta) => {
            const defaultIcon = window.L.divIcon({
                html: markerHtml(meta, false),
                className: 'lensworks-map-chip',
                iconSize: [72, 28],
                iconAnchor: [36, 28]
            });

            const activeIcon = window.L.divIcon({
                html: markerHtml(meta, true),
                className: 'lensworks-map-chip',
                iconSize: [72, 28],
                iconAnchor: [36, 28]
            });

            const marker = window.L.marker([meta.lat, meta.lng], { icon: defaultIcon })
                .addTo(leafletMap)
                .bindPopup(`<strong>${meta.name}</strong><br>${meta.category}<br><span style="color:#475569">${meta.location}</span><br><a href="vendor-profile.html?vendor=${encodeURIComponent(meta.slug)}" style="color:#4f46e5;font-weight:600;">View packages</a>`);

            marker.on('click', () => {
                setActivePin(meta.id);
                const card = cards.find((entry) => entry.dataset.vendorId === meta.id);
                if (card && !card.classList.contains('hidden')) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });

            markerByVendorId.set(meta.id, marker);
            activeMarkerByVendorId.set(meta.id, activeIcon);
        });
    }

    function setActivePin(vendorId) {
        mapPins.forEach((pin, index) => {
            const wrapper = mapPinWrappers[index];
            if (!wrapper) {
                return;
            }

            const active = wrapper.dataset.vendorId === vendorId;
            const arrow = wrapper.querySelector('.w-2.h-2');
            pin.classList.toggle('bg-indigo-600', active);
            pin.classList.toggle('hover:bg-indigo-500', active);
            pin.classList.toggle('bg-slate-900', !active);
            if (arrow) {
                arrow.classList.toggle('bg-indigo-600', active);
                arrow.classList.toggle('bg-slate-900', !active);
            }
        });

        if (leafletMap) {
            vendorMeta.forEach((meta) => {
                const marker = markerByVendorId.get(meta.id);
                const activeIcon = activeMarkerByVendorId.get(meta.id);
                if (!marker || !activeIcon) {
                    return;
                }

                if (meta.id === vendorId) {
                    marker.setIcon(activeIcon);
                    leafletMap.panTo([meta.lat, meta.lng], { animate: true, duration: 0.4 });
                } else {
                    marker.setIcon(window.L.divIcon({
                        html: markerHtml(meta, false),
                        className: 'lensworks-map-chip',
                        iconSize: [72, 28],
                        iconAnchor: [36, 28]
                    }));
                }
            });
        }
    }

    function updateFavoriteUI() {
        cards.forEach((card) => {
            const icon = card.querySelector('button i[data-lucide="heart"]');
            const vendorId = card.dataset.vendorId;
            const active = favorites.has(vendorId);
            if (!icon) {
                return;
            }
            icon.classList.toggle('fill-red-500', active);
            icon.classList.toggle('text-red-500', active);
            icon.classList.toggle('text-white', !active);
        });

        window.localStorage.setItem(favoriteStorageKey, JSON.stringify(Array.from(favorites)));
    }

    function currentFilters() {
        return {
            categories: categoryCheckboxes.filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.nextElementSibling.textContent.trim()),
            maxPrice: Number(priceSlider ? priceSlider.value : 1000),
            location: locationInput ? locationInput.value.trim().toLowerCase() : '',
            travelOnly: Boolean(travelCheckbox && travelCheckbox.checked),
            styles: styleTags.filter((tag) => tag.classList.contains('bg-slate-900')).map((tag) => tag.textContent.trim()),
            sortBy: sortSelect ? sortSelect.value : 'Recommended'
        };
    }

    function renderActiveFilterChips(filters) {
        if (!activeFilterChips) {
            return;
        }

        const chips = [];
        filters.categories.forEach((category) => {
            chips.push({ type: 'category', value: category, label: category });
        });
        filters.styles.forEach((style) => {
            chips.push({ type: 'style', value: style, label: style });
        });
        if (filters.maxPrice < 1000) {
            chips.push({ type: 'price', value: String(filters.maxPrice), label: `Up to $${filters.maxPrice}/hr` });
        }
        if (filters.location) {
            chips.push({ type: 'location', value: filters.location, label: `Location: ${filters.location}` });
        }
        if (filters.travelOnly) {
            chips.push({ type: 'travel', value: 'travel-only', label: 'Willing to travel' });
        }
        if (selectedDate) {
            chips.push({ type: 'date', value: selectedDate, label: `Date: ${selectedDate}` });
        }
        if (filters.sortBy !== 'Recommended') {
            chips.push({ type: 'sort', value: filters.sortBy, label: `Sort: ${filters.sortBy}` });
        }

        if (!chips.length) {
            activeFilterChips.innerHTML = '<span class="text-xs text-gray-500">No active filters. Showing best matches.</span>';
            return;
        }

        activeFilterChips.innerHTML = chips
            .map((chip) => `
                <button data-chip-type="${chip.type}" data-chip-value="${chip.value}" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:border-slate-300 transition">
                    ${chip.label}
                    <i data-lucide="x" class="w-3 h-3"></i>
                </button>
            `)
            .join('');
    }

    function removeFilterByChip(type, value) {
        if (type === 'category') {
            const checkbox = categoryCheckboxes.find((entry) => entry.dataset.category === value);
            if (checkbox) {
                checkbox.checked = false;
            }
        }

        if (type === 'style') {
            const style = styleTags.find((entry) => entry.dataset.style === value);
            if (style) {
                style.classList.remove('bg-slate-900', 'text-white', 'border-slate-900');
                style.classList.add('bg-white', 'text-gray-600', 'border-gray-200');
            }
        }

        if (type === 'price' && priceSlider && priceDisplay) {
            priceSlider.value = '1000';
            priceDisplay.innerText = 'Up to $1000';
        }

        if (type === 'location' && locationInput) {
            locationInput.value = '';
        }

        if (type === 'travel' && travelCheckbox) {
            travelCheckbox.checked = false;
        }

        if (type === 'sort' && sortSelect) {
            sortSelect.value = 'Recommended';
        }

        if (type === 'date') {
            selectedDate = '';
            if (checkDatesLabel) {
                checkDatesLabel.textContent = 'Check Dates';
            }
        }
    }

    function applyQueryFilters() {
        const params = new URLSearchParams(window.location.search || '');
        const service = String(params.get('service') || '').toLowerCase();
        const location = String(params.get('location') || '').trim();
        const date = String(params.get('date') || '').trim();
        const sort = String(params.get('sort') || '').trim();
        const maxPrice = Number(params.get('maxPrice') || 0);
        const view = String(params.get('view') || '').toLowerCase();

        if (service) {
            const serviceMap = {
                wedding: 'Weddings',
                ads: 'Commercial & Ads',
                portrait: 'Portraits & Fashion',
                events: 'Events & Parties'
            };

            const category = serviceMap[service] || '';
            if (category) {
                categoryCheckboxes.forEach((checkbox) => {
                    checkbox.checked = checkbox.dataset.category === category;
                });
            }
        }

        if (locationInput && location) {
            locationInput.value = location;
        }

        if (date) {
            selectedDate = date;
            if (checkDatesLabel) {
                checkDatesLabel.textContent = `Date: ${selectedDate}`;
            }
        }

        if (sortSelect && sort) {
            const option = Array.from(sortSelect.options).find((entry) => entry.value === sort || entry.textContent.trim() === sort);
            if (option) {
                sortSelect.value = option.value;
            }
        }

        if (priceSlider && priceDisplay && maxPrice > 0) {
            const bounded = Math.max(Number(priceSlider.min || 50), Math.min(Number(priceSlider.max || 1000), maxPrice));
            priceSlider.value = String(bounded);
            priceDisplay.innerText = `Up to $${bounded}`;
        }

        if (view === 'map') {
            setView('map');
        }
    }

    function passesFilters(meta, filters) {
        const matchesCategory = !filters.categories.length || filters.categories.some((category) => categoryMatches(category, meta.category));
        const matchesPrice = meta.price <= filters.maxPrice;
        const matchesLocation = !filters.location || meta.location.toLowerCase().includes(filters.location) || (meta.travel && filters.location.length > 1);
        const matchesTravel = !filters.travelOnly || meta.travel;
        const matchesStyles = !filters.styles.length || filters.styles.some((style) => styleMatches(style, meta.styles));
        return matchesCategory && matchesPrice && matchesLocation && matchesTravel && matchesStyles;
    }

    function sortVisibleEntries(entries, sortBy) {
        const sorted = [...entries];
        if (sortBy === 'Price: Low to High') {
            sorted.sort((left, right) => left.meta.price - right.meta.price);
        } else if (sortBy === 'Price: High to Low') {
            sorted.sort((left, right) => right.meta.price - left.meta.price);
        } else if (sortBy === 'Highest Rated') {
            sorted.sort((left, right) => right.meta.rating - left.meta.rating || right.meta.reviews - left.meta.reviews);
        } else {
            sorted.sort((left, right) => right.meta.rating * right.meta.reviews - left.meta.rating * left.meta.reviews);
        }
        return sorted;
    }

    function renderDirectory() {
        const filters = currentFilters();
        const entries = cards.map((card, index) => ({ card, meta: vendorMeta[index], pin: mapPins[index] }));
        const visibleEntries = sortVisibleEntries(entries.filter((entry) => passesFilters(entry.meta, filters)), filters.sortBy);
        const pagedEntries = visibleEntries.slice(0, visibleLimit);
        const visibleIds = new Set(pagedEntries.map((entry) => entry.meta.id));

        entries.forEach((entry) => {
            const visible = visibleIds.has(entry.meta.id);
            entry.card.classList.toggle('hidden', !visible);
            if (entry.pin) {
                entry.pin.parentElement.classList.toggle('hidden', !visible);
            }

            const marker = markerByVendorId.get(entry.meta.id);
            if (marker && leafletMap) {
                if (visible && !leafletMap.hasLayer(marker)) {
                    marker.addTo(leafletMap);
                }
                if (!visible && leafletMap.hasLayer(marker)) {
                    leafletMap.removeLayer(marker);
                }
            }
        });

        pagedEntries.forEach((entry) => {
            cardsGrid.appendChild(entry.card);
        });

        if (resultsCount) {
            resultsCount.textContent = String(visibleEntries.length);
        }

        if (mobileResultsCount) {
            mobileResultsCount.textContent = `${visibleEntries.length} Results`;
        }

        renderActiveFilterChips(filters);

        const existingEmpty = document.getElementById(emptyStateId);
        if (existingEmpty) {
            existingEmpty.remove();
        }

        if (!visibleEntries.length && cardsGrid) {
            const empty = document.createElement('div');
            empty.id = emptyStateId;
            empty.className = 'md:col-span-2 xl:col-span-3 bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-sm text-gray-500';
            empty.innerHTML = 'No photographers match these filters yet. Try widening the location, style, or price range.<div class="mt-4"><button id="no-results-clear" class="px-4 py-2 text-xs font-semibold rounded-full border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition">Reset all filters</button></div>';
            cardsGrid.appendChild(empty);
        }

        if (loadMoreBtn) {
            const viewingMap = Boolean(mapPanel && !mapPanel.classList.contains('hidden'));
            loadMoreBtn.classList.toggle('hidden', viewingMap || visibleEntries.length <= pagedEntries.length);
        }

        if (pagedEntries.length) {
            setActivePin(pagedEntries[0].meta.id);
        }
    }

    function toggleMobileFilters() {
        if (!filterBtn || !sidebar) {
            return;
        }

        const hidden = sidebar.classList.contains('hidden');
        sidebar.classList.toggle('hidden', !hidden);
        sidebar.classList.toggle('block', hidden);
        sidebar.classList.toggle('mb-6', hidden);
        filterBtn.innerHTML = hidden
            ? '<i data-lucide="x" class="w-4 h-4"></i> Close'
            : '<i data-lucide="sliders-horizontal" class="w-4 h-4"></i> Filters';
        window.refreshLensWorksIcons();
    }

    function resetFilters() {
        categoryCheckboxes.forEach((checkbox) => {
            checkbox.checked = true;
        });
        if (travelCheckbox) {
            travelCheckbox.checked = false;
        }
        if (priceSlider) {
            priceSlider.value = 500;
        }
        if (priceDisplay) {
            priceDisplay.innerText = 'Up to $500';
        }
        if (locationInput) {
            locationInput.value = '';
        }
        styleTags.forEach((tag) => {
            const selectedByDefault = false;
            tag.classList.toggle('bg-slate-900', selectedByDefault);
            tag.classList.toggle('text-white', selectedByDefault);
            tag.classList.toggle('border-slate-900', selectedByDefault);
            tag.classList.toggle('bg-white', !selectedByDefault);
            tag.classList.toggle('text-gray-600', !selectedByDefault);
            tag.classList.toggle('border-gray-200', !selectedByDefault);
        });
        if (sortSelect) {
            sortSelect.value = 'Recommended';
        }
        selectedDate = '';
        visibleLimit = 9;
        if (checkDatesLabel) {
            checkDatesLabel.textContent = 'Check Dates';
        }
        renderDirectory();
    }

    function setView(view) {
        const grid = document.querySelector('.grid.grid-cols-1.md\:grid-cols-2.xl\:grid-cols-3.gap-6');
        const gridBtn = document.getElementById('grid-view-btn');
        const mapBtn = document.getElementById('map-view-btn');
        const pagination = mapPanel ? mapPanel.nextElementSibling : null;

        if (view === 'map') {
            if (grid) {
                grid.classList.add('hidden');
            }
            if (mapPanel) {
                mapPanel.classList.remove('hidden');
            }
            if (pagination) {
                pagination.classList.add('hidden');
            }
            if (gridBtn && mapBtn) {
                gridBtn.classList.remove('bg-white', 'shadow-sm', 'text-slate-900');
                gridBtn.classList.add('text-gray-500');
                mapBtn.classList.add('bg-white', 'shadow-sm', 'text-slate-900');
                mapBtn.classList.remove('text-gray-500');
            }
        } else {
            if (grid) {
                grid.classList.remove('hidden');
            }
            if (mapPanel) {
                mapPanel.classList.add('hidden');
            }
            if (pagination) {
                pagination.classList.remove('hidden');
            }
            if (gridBtn && mapBtn) {
                mapBtn.classList.remove('bg-white', 'shadow-sm', 'text-slate-900');
                mapBtn.classList.add('text-gray-500');
                gridBtn.classList.add('bg-white', 'shadow-sm', 'text-slate-900');
                gridBtn.classList.remove('text-gray-500');
            }
        }
    }

    if (filterBtn) {
        filterBtn.addEventListener('click', toggleMobileFilters);
    }

    cards.forEach((card) => {
        registerCardInteractions(card);
    });

    styleTags.forEach((tag) => {
        tag.addEventListener('click', () => {
            tag.classList.toggle('bg-slate-900');
            tag.classList.toggle('text-white');
            tag.classList.toggle('border-slate-900');
            tag.classList.toggle('bg-white');
            tag.classList.toggle('text-gray-600');
            tag.classList.toggle('border-gray-200');
            visibleLimit = 9;
            renderDirectory();
        });
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }

    if (clearActiveFiltersBtn) {
        clearActiveFiltersBtn.addEventListener('click', resetFilters);
    }

    if (activeFilterChips) {
        activeFilterChips.addEventListener('click', (event) => {
            const chip = event.target.closest('button[data-chip-type]');
            if (!chip) {
                return;
            }
            removeFilterByChip(chip.dataset.chipType, chip.dataset.chipValue);
            renderDirectory();
            window.refreshLensWorksIcons();
        });
    }

    [...categoryCheckboxes, travelCheckbox].filter(Boolean).forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
            visibleLimit = 9;
            renderDirectory();
        });
    });

    if (locationInput) {
        locationInput.addEventListener('input', () => {
            visibleLimit = 9;
            renderDirectory();
        });
    }

    if (priceSlider) {
        priceSlider.addEventListener('input', () => {
            if (priceDisplay) {
                priceDisplay.innerText = `Up to $${priceSlider.value}`;
            }
            visibleLimit = 9;
            renderDirectory();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            visibleLimit = 9;
            renderDirectory();
        });
    }

    if (checkDatesBtn) {
        checkDatesBtn.addEventListener('click', () => {
            const nextDate = window.prompt('Enter a preferred date (YYYY-MM-DD):', selectedDate || '');
            if (nextDate === null) {
                return;
            }

            selectedDate = String(nextDate).trim();
            if (checkDatesLabel) {
                checkDatesLabel.textContent = selectedDate ? `Date: ${selectedDate}` : 'Check Dates';
            }
            visibleLimit = 9;
            renderDirectory();
        });
    }

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            visibleLimit += LOAD_MORE_STEP;
            renderDirectory();
        });
    }

    if (cardsGrid) {
        cardsGrid.addEventListener('click', (event) => {
            const resetButton = event.target.closest('#no-results-clear');
            if (resetButton) {
                resetFilters();
            }
        });
    }

    mapPinWrappers.forEach((wrapper, index) => {
        registerPinInteractions(wrapper, index);
    });

    if (mapZoomControls.length >= 2 && mapContainer) {
        let scale = 1;
        const pinLayer = mapPanel.querySelector('.relative.z-10.w-full.h-full');

        function applyScale() {
            if (!pinLayer) {
                return;
            }
            pinLayer.style.transform = `scale(${scale})`;
            pinLayer.style.transformOrigin = 'center center';
        }

        mapZoomControls[0].addEventListener('click', () => {
            scale = Math.min(1.3, Number((scale + 0.05).toFixed(2)));
            applyScale();
        });

        mapZoomControls[1].addEventListener('click', () => {
            scale = Math.max(0.85, Number((scale - 0.05).toFixed(2)));
            applyScale();
        });
    }

    window.setView = setView;

    loadVendorMetaFromApi().finally(() => {
        applyQueryFilters();
        initProviderReadyMap();
        updateFavoriteUI();
        renderDirectory();
        window.refreshLensWorksIcons();
    });
});