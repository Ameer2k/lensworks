document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    let galleryId = params.get('id') || '';
    const storageKey = 'lensworks-gallery-favorites';
    const favoritedIds = new Set(JSON.parse(window.localStorage.getItem(storageKey) || '[]'));
    let currentImageIndex = 0;
    let currentFilter = 'all';

    const items = Array.from(document.querySelectorAll('.masonry-item'));
    let images = items.map((item) => item.querySelector('img').src);
    const fab = document.getElementById('floating-action-bar');
    const fabCount = document.getElementById('fab-count');
    const topFavCount = document.getElementById('fav-count-top');
    const filterAllBtn = document.getElementById('filter-all');
    const filterFavsBtn = document.getElementById('filter-favs');
    const clearFavsBtn = document.getElementById('clear-favs-btn');
    const shareButton = document.querySelector('header button[title="Share Gallery"]');
    const downloadTriggers = Array.from(document.querySelectorAll('.download-trigger'));
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    const lightboxFavBtn = document.getElementById('lightbox-fav-btn');
    const lightboxFilename = document.getElementById('lightbox-filename');
    const lightboxCounter = document.getElementById('lightbox-counter');
    const galleryPhotographerName = document.getElementById('gallery-photographer-name');
    const galleryPhotographerAvatar = document.getElementById('gallery-photographer-avatar');
    const galleryTitleChip = document.getElementById('gallery-title-chip');
    const galleryOwnerName = document.getElementById('gallery-owner-name');
    const galleryMetaLine = document.getElementById('gallery-meta-line');

    function initialsFromName(name) {
        const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
        if (!parts.length) {
            return 'LW';
        }
        return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
    }

    function avatarFromName(name) {
        const initials = encodeURIComponent(initialsFromName(name));
        return `https://ui-avatars.com/api/?name=${initials}&background=0f172a&color=ffffff&bold=true&size=128`;
    }

    function setGalleryIdentity(meta = {}) {
        const viewerName = String(meta.viewerName || 'LensWorks Client').trim();
        const photographerName = String(meta.photographerName || 'LensWorks Pro').trim();
        const title = String(meta.title || 'Delivered Gallery').trim();
        const photoCount = Number(meta.photoCount || 0);

        if (galleryPhotographerName) {
            galleryPhotographerName.textContent = photographerName;
        }
        if (galleryPhotographerAvatar) {
            galleryPhotographerAvatar.src = avatarFromName(photographerName);
            galleryPhotographerAvatar.alt = photographerName;
        }
        if (galleryTitleChip) {
            galleryTitleChip.textContent = title;
        }
        if (galleryOwnerName) {
            galleryOwnerName.textContent = viewerName;
        }
        if (galleryMetaLine) {
            galleryMetaLine.innerHTML = `<i data-lucide="image" class="w-4 h-4"></i> ${photoCount || images.length} High-Res Photos`;
        }
    }

    async function hydrateViewerIdentity() {
        if (!window.LensWorksApi?.auth?.me) {
            return;
        }

        const meResult = await window.LensWorksApi.auth.me();
        if (!meResult.ok) {
            return;
        }

        const user = meResult.payload?.data?.user || {};
        setGalleryIdentity({ viewerName: user.fullName || 'LensWorks Client' });
        window.refreshLensWorksIcons();
    }

    function persistFavorites() {
        window.localStorage.setItem(storageKey, JSON.stringify(Array.from(favoritedIds)));
    }

    function animateDownload(button, loadingText, completeText) {
        const originalHtml = button.innerHTML;
        const iconOnly = !button.querySelector('.btn-text');
        button.innerHTML = iconOnly
            ? '<i data-lucide="loader-2" class="w-5 h-5 animate-spin drop-shadow-md"></i>'
            : `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> <span class="btn-text">${loadingText}</span>`;
        window.refreshLensWorksIcons();

        setTimeout(() => {
            button.innerHTML = iconOnly
                ? '<i data-lucide="check" class="w-5 h-5 text-green-400 drop-shadow-md"></i>'
                : `<i data-lucide="check" class="w-4 h-4 text-green-400"></i> <span class="btn-text text-green-400">${completeText}</span>`;
            window.refreshLensWorksIcons();
            setTimeout(() => {
                button.innerHTML = originalHtml;
                window.refreshLensWorksIcons();
            }, 1500);
        }, 900);
    }

    function applyFilter() {
        items.forEach((item) => {
            if (item.dataset.apiHidden === 'true') {
                item.style.display = 'none';
                return;
            }

            const visible = currentFilter === 'all' || favoritedIds.has(item.dataset.id);
            item.style.display = visible ? 'block' : 'none';
        });
    }

    function updateFavoritesUI() {
        const count = favoritedIds.size;
        fabCount.innerText = count;
        topFavCount.innerText = count;

        if (count > 0) {
            fab.classList.add('visible');
        } else {
            fab.classList.remove('visible');
            if (currentFilter === 'favs') {
                currentFilter = 'all';
            }
        }

        items.forEach((item) => {
            const active = favoritedIds.has(item.dataset.id);
            const button = item.querySelector('.fav-btn');
            const icon = button.querySelector('i');
            item.classList.toggle('is-selected', active);
            button.classList.toggle('is-favorited', active);
            button.classList.toggle('opacity-100', active);
            button.classList.toggle('opacity-0', !active);
            icon.classList.toggle('fill-red-500', active);
            icon.classList.toggle('text-red-500', active);
            icon.classList.toggle('text-white', !active);
        });

        if (!lightbox.classList.contains('hidden-fade')) {
            lightboxFavBtn.querySelector('i').classList.toggle('is-favorited', favoritedIds.has(items[currentImageIndex].dataset.id));
        }

        filterAllBtn.classList.toggle('bg-white', currentFilter === 'all');
        filterAllBtn.classList.toggle('text-slate-900', currentFilter === 'all');
        filterAllBtn.classList.toggle('shadow-sm', currentFilter === 'all');
        filterFavsBtn.classList.toggle('bg-white', currentFilter === 'favs');
        filterFavsBtn.classList.toggle('text-slate-900', currentFilter === 'favs');
        filterFavsBtn.classList.toggle('shadow-sm', currentFilter === 'favs');
        persistFavorites();
        applyFilter();
    }

    async function hydrateGalleryFromApi() {
        if (!window.LensWorksApi || !window.LensWorksApi.galleries) {
            return;
        }

        if (!galleryId && window.LensWorksApi.galleries.listMine) {
            const listResult = await window.LensWorksApi.galleries.listMine();
            if (listResult.ok) {
                const first = listResult.payload?.data?.items?.[0];
                if (first?.id) {
                    galleryId = first.id;
                }
            }
        }

        if (!galleryId) {
            galleryId = 'gal_demo_1';
        }

        const result = await window.LensWorksApi.galleries.getById(galleryId);
        if (!result.ok) {
            return;
        }

        const assets = result.payload?.data?.assets || [];
        if (!assets.length) {
            return;
        }

        setGalleryIdentity({
            title: result.payload?.data?.title || 'Delivered Gallery',
            photographerName: result.payload?.data?.photographerName || 'LensWorks Pro',
            viewerName: result.payload?.data?.viewerName || 'LensWorks Client',
            photoCount: assets.length
        });

        const validIds = new Set();

        items.forEach((item, index) => {
            const image = item.querySelector('img');
            const filenameNode = item.querySelector('.photo-overlay p.text-white');
            const asset = assets[index];

            if (!asset || !image) {
                item.dataset.apiHidden = 'true';
                item.style.display = 'none';
                return;
            }

            item.dataset.apiHidden = 'false';
            item.style.display = 'block';
            item.dataset.id = asset.id;
            item.dataset.filename = `IMG_${String(index + 1).padStart(4, '0')}.jpg`;
            image.src = asset.thumbnailUrl || asset.assetUrl;
            image.alt = `Gallery image ${index + 1}`;

            if (filenameNode) {
                filenameNode.textContent = item.dataset.filename;
            }

            validIds.add(asset.id);
            if (asset.isFavorite) {
                favoritedIds.add(asset.id);
            }
        });

        Array.from(favoritedIds).forEach((id) => {
            if (!validIds.has(id)) {
                favoritedIds.delete(id);
            }
        });

        images = items.map((item) => item.querySelector('img')?.src || '').filter(Boolean);
        updateFavoritesUI();
    }

    function openLightbox(index) {
        currentImageIndex = index;
        lightboxImg.src = images[index];
        lightboxFilename.innerText = items[index].dataset.filename || `IMG_000${index + 1}.jpg`;
        lightboxCounter.innerText = index + 1;
        lightboxFavBtn.querySelector('i').classList.toggle('is-favorited', favoritedIds.has(items[index].dataset.id));
        lightbox.classList.remove('hidden-fade');
        lightbox.classList.add('visible-fade');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('visible-fade');
        lightbox.classList.add('hidden-fade');
        document.body.style.overflow = '';
        setTimeout(() => {
            lightboxImg.src = '';
        }, 300);
    }

    function navigateLightbox(direction) {
        let nextIndex = currentImageIndex;
        do {
            nextIndex = (nextIndex + direction + items.length) % items.length;
        } while (items[nextIndex].style.display === 'none' && nextIndex !== currentImageIndex);
        openLightbox(nextIndex);
    }

    items.forEach((item, index) => {
        const favoriteButton = item.querySelector('.fav-btn');
        const favoriteIcon = favoriteButton.querySelector('i');
        const imageTrigger = item.querySelector('.image-trigger');

        favoriteButton.addEventListener('click', (event) => {
            event.stopPropagation();
            favoriteIcon.classList.remove('heart-animate');
            void favoriteIcon.offsetWidth;
            favoriteIcon.classList.add('heart-animate');

            if (favoritedIds.has(item.dataset.id)) {
                favoritedIds.delete(item.dataset.id);
            } else {
                favoritedIds.add(item.dataset.id);
            }

            updateFavoritesUI();
        });

        imageTrigger.addEventListener('click', () => openLightbox(index));
    });

    clearFavsBtn.addEventListener('click', () => {
        favoritedIds.clear();
        updateFavoritesUI();
    });

    filterAllBtn.addEventListener('click', () => {
        currentFilter = 'all';
        updateFavoritesUI();
    });

    filterFavsBtn.addEventListener('click', () => {
        if (!favoritedIds.size) {
            return;
        }
        currentFilter = 'favs';
        updateFavoritesUI();
    });

    downloadTriggers.forEach((button) => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            animateDownload(button, 'Downloading...', 'Complete');
        });
    });

    if (shareButton) {
        shareButton.addEventListener('click', async () => {
            const url = window.location.href;
            const title = document.title || 'Your Gallery | LensWorks';

            // Prefer native Web Share (shows OS share sheet on mobile)
            if (navigator.share) {
                try {
                    await navigator.share({ title, url });
                    return;
                } catch (err) {
                    if (err.name === 'AbortError') {
                        return; // user cancelled — no feedback needed
                    }
                    // fall through to clipboard
                }
            }

            // Clipboard API fallback
            if (navigator.clipboard && navigator.clipboard.writeText) {
                try {
                    await navigator.clipboard.writeText(url);
                    animateDownload(shareButton, 'Copying...', 'Link Copied!');
                    return;
                } catch {
                    // permission denied — fall through to prompt
                }
            }

            // Last resort: visible prompt so user can copy manually
            window.prompt('Copy this link to share your gallery:', url);
        });
    }

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxNext.addEventListener('click', (event) => {
        event.stopPropagation();
        navigateLightbox(1);
    });
    lightboxPrev.addEventListener('click', (event) => {
        event.stopPropagation();
        navigateLightbox(-1);
    });
    lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox || event.target.parentElement === lightbox) {
            closeLightbox();
        }
    });
    document.addEventListener('keydown', (event) => {
        if (!lightbox.classList.contains('visible-fade')) {
            return;
        }
        if (event.key === 'Escape') {
            closeLightbox();
        }
        if (event.key === 'ArrowRight') {
            navigateLightbox(1);
        }
        if (event.key === 'ArrowLeft') {
            navigateLightbox(-1);
        }
    });

    lightboxFavBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        const currentId = items[currentImageIndex].dataset.id;
        if (favoritedIds.has(currentId)) {
            favoritedIds.delete(currentId);
        } else {
            favoritedIds.add(currentId);
        }
        updateFavoritesUI();
    });

    updateFavoritesUI();
    hydrateViewerIdentity();
    hydrateGalleryFromApi();
});