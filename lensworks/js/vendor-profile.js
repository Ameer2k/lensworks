document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const vendorSlug = params.get('vendor') || 'sarah-jenkins';

    const photographer = {
        name: 'LensWorks Photographer',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop',
        location: 'Session location pending'
    };

    function getPackageRadios() {
        return document.querySelectorAll('input[name="package"]');
    }
    const addOnCheckboxes = document.querySelectorAll('.addon-checkbox');
    const totalPriceDisplay = document.getElementById('total-price');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const bookNowBtn = document.getElementById('book-now-btn');
    const messageVendorBtn = document.getElementById('vendor-message-btn');
    const shareVendorBtn = document.getElementById('vendor-share-btn');
    const packageContainer = document.getElementById('package-container');
    const reviewForm = document.getElementById('review-form');
    const reviewRating = document.getElementById('review-rating');
    const reviewBody = document.getElementById('review-body');
    const reviewSubmitBtn = document.getElementById('review-submit-btn');
    const reviewStatus = document.getElementById('review-status');
    const reviewsSummaryRating = document.getElementById('reviews-summary-rating');
    const reviewsSummaryCount = document.getElementById('reviews-summary-count');
    const vendorResponseBadge = document.getElementById('vendor-response-badge');
    const vendorCompletedBadge = document.getElementById('vendor-completed-badge');
    const packageCompareTable = document.getElementById('package-compare-table');
    const faqList = document.getElementById('vendor-faq-list');
    const stepPackage = document.getElementById('step-package');
    const stepAddons = document.getElementById('step-addons');
    const stepDate = document.getElementById('step-date');
    const stepCheckout = document.getElementById('step-checkout');
    const bookingSubtotal = document.getElementById('booking-subtotal');
    const bookingFee = document.getElementById('booking-fee');
    const bookingTotal = document.getElementById('booking-total');
    const bookingDeposit = document.getElementById('booking-deposit');
    const bookingBalance = document.getElementById('booking-balance');
    let currentVendor = null;
    let currentReviews = [];

    function formatMoney(value) {
        return `$${Number(value || 0).toLocaleString()}`;
    }

    function renderPackages(packages) {
        if (!packageContainer || !Array.isArray(packages) || !packages.length) {
            return;
        }

        packageContainer.innerHTML = packages
            .map((pkg, index) => {
                const checked = index === 0 ? 'checked' : '';
                const popular = index === 0;
                return `
                    <label class="block cursor-pointer group">
                        <input type="radio" name="package" value="${Number(pkg.price || 0)}" class="peer sr-only" ${checked}>
                        <div class="p-4 rounded-xl border-2 ${popular ? 'border-slate-900 bg-slate-50' : 'border-gray-200'} peer-checked:border-slate-900 peer-checked:bg-slate-50 hover:border-gray-300 transition relative">
                            ${popular ? '<div class="absolute -top-3 left-4 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Popular</div>' : ''}
                            <div class="flex justify-between items-start mb-1 ${popular ? 'mt-1' : ''}">
                                <h3 class="font-bold text-slate-900">${pkg.name || 'Session'}</h3>
                                <span class="font-bold text-lg text-slate-900">${formatMoney(pkg.price)}</span>
                            </div>
                            <p class="text-sm text-gray-500 mb-3">${pkg.description || 'Photography session package'}</p>
                        </div>
                    </label>
                `;
            })
            .join('');

        const nextPackageRadios = document.querySelectorAll('input[name="package"]');
        nextPackageRadios.forEach((radio) => radio.addEventListener('change', calculateTotal));
    }

    function hydrateVendorHero(vendor) {
        if (!vendor) {
            return;
        }

        currentVendor = vendor;

        photographer.name = vendor.displayName || photographer.name;
        photographer.image = vendor.avatarUrl || photographer.image;
        photographer.location = vendor.city ? `${vendor.city}, Bahrain` : photographer.location;

        const pageTitle = document.querySelector('title');
        if (pageTitle) {
            pageTitle.textContent = `${photographer.name} - Profile & Booking | LensWorks`;
        }

        const coverImage = document.querySelector('.h-64.md\\:h-80 img');
        if (coverImage && vendor.coverImageUrl) {
            coverImage.src = vendor.coverImageUrl;
            coverImage.alt = `${photographer.name} cover`;
        }

        const profileImage = document.querySelector('.w-32.h-32.md\\:w-40.md\\:h-40');
        if (profileImage && photographer.image) {
            profileImage.src = photographer.image;
            profileImage.alt = `${photographer.name} profile`;
        }

        const heading = document.querySelector('h1.text-3xl.font-bold');
        if (heading) {
            const icon = heading.querySelector('i');
            heading.innerHTML = '';
            heading.append(document.createTextNode(`${photographer.name} `));
            if (icon) {
                heading.append(icon);
            }
        }

        const subtitle = document.querySelector('p.text-gray-500.font-medium');
        if (subtitle) {
            subtitle.textContent = `${vendor.tagline || 'LensWorks Pro'} • ${vendor.styles?.join(' • ') || 'Photography'}`;
        }

        const ratingBadge = document.querySelector('.bg-yellow-50.px-2.py-1.rounded-md.font-bold.text-slate-800');
        if (ratingBadge) {
            ratingBadge.innerHTML = `<i data-lucide="star" class="w-4 h-4 text-yellow-500 fill-yellow-500"></i> ${Number(vendor.rating || 0).toFixed(1)} (${Number(vendor.reviewCount || 0)} Reviews)`;
        }

        const locationNode = document.querySelector('.flex.items-center.gap-1.text-gray-500');
        if (locationNode) {
            const pin = locationNode.querySelector('i');
            locationNode.innerHTML = '';
            if (pin) {
                locationNode.append(pin);
            }
            locationNode.append(document.createTextNode(` ${photographer.location}`));
        }

        const bioHeading = Array.from(document.querySelectorAll('h2')).find((node) => node.textContent.includes('About'));
        const bioText = bioHeading ? bioHeading.nextElementSibling : null;
        if (bioText && vendor.bio) {
            bioText.textContent = vendor.bio;
        }

        if (reviewsSummaryRating) {
            reviewsSummaryRating.textContent = Number(vendor.rating || 0).toFixed(1);
        }

        if (reviewsSummaryCount) {
            reviewsSummaryCount.textContent = `(${Number(vendor.reviewCount || 0)} verified)`;
        }

        const responseHours = Number(vendor.reviewCount || 0) >= 180 ? 1 : Number(vendor.rating || 0) >= 4.8 ? 2 : 4;
        const completedShoots = Math.max(24, Math.round(Number(vendor.reviewCount || 0) * 2.4));

        if (vendorResponseBadge) {
            vendorResponseBadge.innerHTML = `<i data-lucide="timer" class="w-3 h-3"></i> Responds in ${responseHours}h`;
        }

        if (vendorCompletedBadge) {
            vendorCompletedBadge.innerHTML = `<i data-lucide="sparkles" class="w-3 h-3"></i> ${completedShoots}+ completed shoots`;
        }
    }

    function inferCoverage(description) {
        const text = String(description || '').toLowerCase();
        if (text.includes('8 hour')) return '8 hours';
        if (text.includes('5 hour')) return '5 hours';
        if (text.includes('4 hour')) return '4 hours';
        if (text.includes('3 hour')) return '3 hours';
        if (text.includes('2 hour')) return '2 hours';
        if (text.includes('1 hour')) return '1 hour';
        return 'Custom';
    }

    function inferBestFor(name = '', description = '') {
        const blob = `${name} ${description}`.toLowerCase();
        if (blob.includes('wedding') || blob.includes('full day')) return 'Weddings & major shoots';
        if (blob.includes('engagement') || blob.includes('event')) return 'Engagements & events';
        if (blob.includes('portrait') || blob.includes('editorial')) return 'Portraits & personal sessions';
        if (blob.includes('brand') || blob.includes('campaign') || blob.includes('commercial')) return 'Brand and campaign work';
        return 'Flexible sessions';
    }

    function renderPackageComparison(packages) {
        if (!packageCompareTable || !Array.isArray(packages) || !packages.length) {
            return;
        }

        packageCompareTable.innerHTML = packages
            .slice(0, 4)
            .map((pkg) => `
                <tr>
                    <td class="py-3 pr-4 font-semibold text-slate-900">${pkg.name || 'Session'}</td>
                    <td class="py-3 pr-4 text-slate-700">${formatMoney(pkg.price)}</td>
                    <td class="py-3 pr-4 text-gray-600">${inferCoverage(pkg.description)}</td>
                    <td class="py-3 text-gray-600">${inferBestFor(pkg.name, pkg.description)}</td>
                </tr>
            `)
            .join('');
    }

    function renderFaq(vendor) {
        if (!faqList || !vendor) {
            return;
        }

        const city = vendor.city || 'your city';
        const faqs = [
            {
                q: 'How soon will I receive my photos?',
                a: 'Standard delivery is 5-7 days, with an expedited add-on available for 48-hour delivery.'
            },
            {
                q: 'Do you travel for shoots?',
                a: `Yes. ${vendor.displayName || 'This photographer'} accepts sessions around ${city} and can travel for destination shoots on request.`
            },
            {
                q: 'What is your cancellation or reschedule policy?',
                a: 'Rescheduling is free up to 72 hours before your session. Last-minute changes are reviewed case by case.'
            }
        ];

        faqList.innerHTML = faqs
            .map((faq, index) => `
                <details class="bg-white border border-gray-200 rounded-xl p-4 group" ${index === 0 ? 'open' : ''}>
                    <summary class="cursor-pointer list-none font-semibold text-slate-900 flex items-center justify-between">${faq.q}<i data-lucide="chevron-down" class="w-4 h-4 text-gray-400 group-open:rotate-180 transition"></i></summary>
                    <p class="text-sm text-gray-600 mt-3">${faq.a}</p>
                </details>
            `)
            .join('');
    }

    function setStepState(step, active) {
        if (!step) {
            return;
        }

        step.classList.toggle('bg-slate-900', active);
        step.classList.toggle('text-white', active);
        step.classList.toggle('bg-slate-100', !active);
        step.classList.toggle('text-slate-500', !active);
    }

    function updateBookingSteps(stage = 'package') {
        setStepState(stepPackage, true);
        setStepState(stepAddons, ['addons', 'date', 'checkout'].includes(stage));
        setStepState(stepDate, ['date', 'checkout'].includes(stage));
        setStepState(stepCheckout, stage === 'checkout');
    }

    function renderReviews(reviews) {
        const reviewsSection = document.getElementById('reviews');
        if (!reviewsSection || !Array.isArray(reviews)) {
            return;
        }

        currentReviews = reviews;

        const list = reviewsSection.querySelector('.space-y-5');
        if (!list) {
            return;
        }

        if (!reviews.length) {
            list.innerHTML = '<div class="bg-white border border-dashed border-gray-300 rounded-2xl p-6 text-sm text-gray-500">No reviews yet. Be the first to leave one.</div>';
            return;
        }

        list.innerHTML = reviews
            .slice(0, 6)
            .map((review) => {
                const stars = Math.max(1, Math.min(5, Number(review.rating || 5)));
                const starsHtml = Array.from({ length: 5 })
                    .map((_, index) => `<i data-lucide="star" class="w-4 h-4 ${index < stars ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200 fill-gray-200'}"></i>`)
                    .join('');

                return `
                    <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <div class="flex items-start justify-between mb-3">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">${String(review.author || 'U').slice(0, 2).toUpperCase()}</div>
                                <div>
                                    <p class="font-bold text-sm text-slate-900">${review.author || 'LensWorks Client'}</p>
                                    <p class="text-xs text-gray-500">Verified Booking</p>
                                </div>
                            </div>
                            <div class="flex gap-0.5">${starsHtml}</div>
                        </div>
                        <p class="text-sm text-gray-600 leading-relaxed">${review.body || ''}</p>
                    </div>
                `;
            })
            .join('');
    }

    function setReviewStatus(message, tone = 'neutral') {
        if (!reviewStatus) {
            return;
        }

        reviewStatus.textContent = message;
        reviewStatus.classList.remove('hidden', 'text-red-600', 'text-emerald-600', 'text-gray-500');
        if (tone === 'error') {
            reviewStatus.classList.add('text-red-600');
            return;
        }

        if (tone === 'success') {
            reviewStatus.classList.add('text-emerald-600');
            return;
        }

        reviewStatus.classList.add('text-gray-500');
    }

    function updateReviewSummariesFromList() {
        if (!Array.isArray(currentReviews) || !currentReviews.length) {
            if (reviewsSummaryRating) {
                reviewsSummaryRating.textContent = '0.0';
            }
            if (reviewsSummaryCount) {
                reviewsSummaryCount.textContent = '(0 verified)';
            }
            return;
        }

        const count = currentReviews.length;
        const avg = currentReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / count;
        if (reviewsSummaryRating) {
            reviewsSummaryRating.textContent = avg.toFixed(1);
        }
        if (reviewsSummaryCount) {
            reviewsSummaryCount.textContent = `(${count} verified)`;
        }
    }

    async function handleReviewSubmit(event) {
        event.preventDefault();
        if (!reviewRating || !reviewBody || !reviewSubmitBtn) {
            return;
        }

        const rating = Number(reviewRating.value || 0);
        const body = reviewBody.value.trim();
        if (!rating || !body) {
            setReviewStatus('Please provide a rating and comment.', 'error');
            return;
        }

        reviewSubmitBtn.disabled = true;
        reviewSubmitBtn.classList.add('opacity-60', 'cursor-not-allowed');
        setReviewStatus('Submitting your review...', 'neutral');

        const result = await window.LensWorksApi.vendors.createReview(vendorSlug, { rating, body });
        reviewSubmitBtn.disabled = false;
        reviewSubmitBtn.classList.remove('opacity-60', 'cursor-not-allowed');

        if (!result.ok) {
            const message = result.error?.payload?.message || 'Unable to submit review right now.';
            setReviewStatus(message, 'error');
            return;
        }

        const created = result.payload?.data?.review;
        if (created) {
            currentReviews = [created, ...currentReviews];
            renderReviews(currentReviews);
            updateReviewSummariesFromList();
        }

        if (currentVendor && result.payload?.data) {
            currentVendor = {
                ...currentVendor,
                rating: result.payload.data.rating,
                reviewCount: result.payload.data.reviewCount
            };
            hydrateVendorHero(currentVendor);
        }

        reviewBody.value = '';
        reviewRating.value = '5';
        setReviewStatus('Review submitted successfully.', 'success');
        window.refreshLensWorksIcons();
    }

    function getSelectedPackage() {
        const selected = document.querySelector('input[name="package"]:checked');
        const card = selected ? selected.nextElementSibling : null;

        return {
            name: card ? card.querySelector('h3').textContent.trim() : 'Premium Session',
            description: card ? card.querySelector('p').textContent.trim() : '3 Hours Coverage',
            price: selected ? Number(selected.value) : 0
        };
    }

    function getSelectedAddOns() {
        return Array.from(addOnCheckboxes)
            .filter((checkbox) => checkbox.checked)
            .map((checkbox) => {
                const row = checkbox.nextElementSibling;
                const name = row.querySelector('span.text-sm.font-medium').textContent.trim();
                const price = Number(checkbox.value);

                return { name, price };
            });
    }

    function toggleAddOnState() {
        addOnCheckboxes.forEach((checkbox) => {
            const row = checkbox.nextElementSibling;
            const icon = row.querySelector('.check-icon');
            const box = row.querySelector('.w-5.h-5');

            row.classList.toggle('border-slate-900', checkbox.checked);
            row.classList.toggle('bg-slate-50', checkbox.checked);
            row.classList.toggle('border-gray-200', !checkbox.checked);
            box.classList.toggle('bg-slate-900', checkbox.checked);
            box.classList.toggle('border-slate-900', checkbox.checked);
            box.classList.toggle('bg-white', !checkbox.checked);
            box.classList.toggle('border-gray-300', !checkbox.checked);
            icon.classList.toggle('opacity-0', !checkbox.checked);
            icon.classList.toggle('scale-50', !checkbox.checked);
            icon.classList.toggle('opacity-100', checkbox.checked);
            icon.classList.toggle('scale-100', checkbox.checked);
            icon.classList.toggle('text-white', checkbox.checked);
            icon.classList.toggle('text-slate-900', !checkbox.checked);
        });
    }

    function buildCartItem() {
        const selectedPackage = getSelectedPackage();
        const addOns = getSelectedAddOns();
        const subtotal = selectedPackage.price + addOns.reduce((sum, item) => sum + item.price, 0);
        const serviceFee = Number((subtotal * 0.05).toFixed(2));
        const total = Number((subtotal + serviceFee).toFixed(2));
        const deposit = Number((total * 0.2).toFixed(2));
        const packageSlug = String(selectedPackage.name || 'session').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        return {
            id: `booking-${vendorSlug}-${packageSlug || 'session'}`,
            vendorSlug,
            photographer: photographer.name,
            photographerImage: photographer.image,
            packageName: selectedPackage.name,
            packageDescription: selectedPackage.description,
            packagePrice: selectedPackage.price,
            addOns,
            subtotal,
            serviceFee,
            total,
            deposit,
            date: '2026-10-14',
            time: '10:00 AM',
            location: photographer.location
        };
    }

    function calculateTotal() {
        const selectedPackage = document.querySelector('input[name="package"]:checked');
        let subtotal = selectedPackage ? Number(selectedPackage.value) : 0;

        getPackageRadios().forEach((radio) => {
            const container = radio.nextElementSibling;
            container.classList.toggle('border-slate-900', radio.checked);
            container.classList.toggle('bg-slate-50', radio.checked);
            container.classList.toggle('border-gray-200', !radio.checked);
        });

        addOnCheckboxes.forEach((checkbox) => {
            if (checkbox.checked) {
                subtotal += Number(checkbox.value);
            }
        });

        const serviceFeeAmount = Number((subtotal * 0.05).toFixed(2));
        const total = Number((subtotal + serviceFeeAmount).toFixed(2));
        const deposit = Number((total * 0.2).toFixed(2));
        const balance = Number((total - deposit).toFixed(2));

        toggleAddOnState();
        totalPriceDisplay.textContent = formatMoney(subtotal);
        totalPriceDisplay.classList.add('scale-110', 'text-blue-600');
        setTimeout(() => {
            totalPriceDisplay.classList.remove('scale-110', 'text-blue-600');
        }, 200);

        if (bookingSubtotal) {
            bookingSubtotal.textContent = formatMoney(subtotal);
        }
        if (bookingFee) {
            bookingFee.textContent = formatMoney(serviceFeeAmount);
        }
        if (bookingTotal) {
            bookingTotal.textContent = formatMoney(total);
        }
        if (bookingDeposit) {
            bookingDeposit.textContent = formatMoney(deposit);
        }
        if (bookingBalance) {
            bookingBalance.textContent = formatMoney(balance);
        }

        updateBookingSteps(addOnCheckboxes.some((checkbox) => checkbox.checked) ? 'addons' : 'package');

        window.LensWorksStore.setCheckoutDraft(buildCartItem());
    }

    function flashAddedState() {
        if (!addToCartBtn) return;

        addToCartBtn.innerHTML = '<i data-lucide="check" class="w-5 h-5"></i> Added to Cart';
        addToCartBtn.classList.add('bg-green-50', 'border-green-500', 'text-green-700');
        addToCartBtn.classList.remove('border-slate-900', 'text-slate-900');
        addToCartBtn.disabled = true;
        window.refreshLensWorksIcons();

        setTimeout(() => {
            addToCartBtn.innerHTML = '<i data-lucide="shopping-bag" class="w-5 h-5"></i> Add to Cart';
            addToCartBtn.classList.remove('bg-green-50', 'border-green-500', 'text-green-700');
            addToCartBtn.classList.add('border-slate-900', 'text-slate-900');
            addToCartBtn.disabled = false;
            window.refreshLensWorksIcons();
        }, 1800);
    }

    getPackageRadios().forEach((radio) => radio.addEventListener('change', calculateTotal));
    addOnCheckboxes.forEach((checkbox) => checkbox.addEventListener('change', calculateTotal));

    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', async () => {
            const item = buildCartItem();
            window.LensWorksStore.addCartItem(item);
            await window.LensWorksApi.cart.addItem(item);
            flashAddedState();
        });
    }

    if (bookNowBtn) {
        bookNowBtn.addEventListener('click', () => {
            const item = buildCartItem();
            window.LensWorksStore.setCheckoutDraft(item);
            updateBookingSteps('checkout');
            window.location.href = 'checkout.html';
        });
    }

    if (messageVendorBtn) {
        messageVendorBtn.addEventListener('click', async () => {
            if (!window.LensWorksApi?.messages?.openConversation) {
                window.location.href = 'client-dashboard.html?tab=messages';
                return;
            }

            const originalMarkup = messageVendorBtn.innerHTML;
            messageVendorBtn.disabled = true;
            messageVendorBtn.classList.add('opacity-60', 'cursor-not-allowed');
            messageVendorBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Opening Chat';
            window.refreshLensWorksIcons();

            const result = await window.LensWorksApi.messages.openConversation({ vendorSlug });
            if (!result.ok) {
                const status = Number(result.error?.status || 0);
                if (status === 401 || status === 403) {
                    window.location.href = 'login.html';
                    return;
                }

                messageVendorBtn.disabled = false;
                messageVendorBtn.classList.remove('opacity-60', 'cursor-not-allowed');
                messageVendorBtn.innerHTML = originalMarkup;
                window.refreshLensWorksIcons();
                window.location.href = 'client-dashboard.html?tab=messages';
                return;
            }

            const conversationId = result.payload?.data?.conversation?.id;
            const params = new URLSearchParams({ tab: 'messages' });
            if (conversationId) {
                params.set('conversation', conversationId);
            }
            window.location.href = `client-dashboard.html?${params.toString()}`;
        });
    }

    if (shareVendorBtn) {
        shareVendorBtn.addEventListener('click', async () => {
            const url = window.location.href;
            const title = `${photographer.name} on LensWorks`;

            if (navigator.share) {
                try {
                    await navigator.share({ title, url });
                    return;
                } catch {
                    // Fallback to clipboard below.
                }
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                try {
                    await navigator.clipboard.writeText(url);
                    return;
                } catch {
                    // Fallback prompt below.
                }
            }

            window.prompt('Copy this profile link:', url);
        });
    }

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    const lightboxCounter = document.getElementById('lightbox-counter');
    const portfolioImages = Array.from(document.querySelectorAll('.portfolio-img'));
    let activeImageIndex = 0;

    function renderLightbox(index) {
        if (!portfolioImages.length || !lightboxImg) {
            return;
        }

        activeImageIndex = (index + portfolioImages.length) % portfolioImages.length;
        const activeImage = portfolioImages[activeImageIndex];
        lightboxImg.src = activeImage.src;
        lightboxImg.alt = activeImage.alt || `Portfolio image ${activeImageIndex + 1}`;

        if (lightboxCounter) {
            lightboxCounter.textContent = `${activeImageIndex + 1} / ${portfolioImages.length}`;
        }
    }

    function openLightbox(index) {
        renderLightbox(index);
        lightbox.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    portfolioImages.forEach((img, index) => {
        img.addEventListener('click', () => {
            openLightbox(index);
        });
    });

    function closeLightbox() {
        lightbox.classList.add('hidden');
        document.body.style.overflow = '';
        setTimeout(() => {
            lightboxImg.src = '';
        }, 300);
    }

    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }

    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', (event) => {
            event.stopPropagation();
            renderLightbox(activeImageIndex - 1);
        });
    }

    if (lightboxNext) {
        lightboxNext.addEventListener('click', (event) => {
            event.stopPropagation();
            renderLightbox(activeImageIndex + 1);
        });
    }

    if (lightbox) {
        lightbox.addEventListener('click', (event) => {
            if (event.target === lightbox) {
                closeLightbox();
            }
        });
    }

    document.addEventListener('keydown', (event) => {
        if (!lightbox || lightbox.classList.contains('hidden')) {
            return;
        }

        if (event.key === 'Escape') {
            closeLightbox();
        }

        if (event.key === 'ArrowLeft') {
            renderLightbox(activeImageIndex - 1);
        }

        if (event.key === 'ArrowRight') {
            renderLightbox(activeImageIndex + 1);
        }
    });

    Promise.all([
        window.LensWorksApi.vendors.getBySlug(vendorSlug),
        window.LensWorksApi.vendors.getReviews(vendorSlug),
        window.LensWorksApi.vendors.getPackages(vendorSlug)
    ]).then(([vendorResult, reviewsResult, packagesResult]) => {
        if (vendorResult.ok) {
            const vendor = vendorResult.payload?.data?.vendor;
            hydrateVendorHero(vendor);
        }

        if (packagesResult.ok) {
            const packages = packagesResult.payload?.data?.packages;
            renderPackages(packages);
            renderPackageComparison(packages);
        }

        if (reviewsResult.ok) {
            const reviews = reviewsResult.payload?.data?.reviews;
            renderReviews(reviews);
            updateReviewSummariesFromList();
        }

        if (vendorResult.ok) {
            const vendor = vendorResult.payload?.data?.vendor;
            renderFaq(vendor);
        }

        window.refreshLensWorksIcons();
        updateBookingSteps('package');
        calculateTotal();
    });

    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewSubmit);
    }
});