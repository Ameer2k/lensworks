document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'lensworks-account-settings-v1';
    const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
    const tabContents = Array.from(document.querySelectorAll('.tab-content'));
    const saveProfileButton = document.getElementById('save-profile-btn');
    const profileTab = document.getElementById('tab-profile');
    const accountTab = document.getElementById('tab-account');
    const securityTab = document.getElementById('tab-security');
    const notificationsTab = document.getElementById('tab-notifications');
    const billingTab = document.getElementById('tab-billing');
    const accountEmailNode = document.getElementById('settings-account-email');
    const accountPhoneNode = document.getElementById('settings-account-phone');
    const phoneUpdateBtn = document.getElementById('settings-phone-update-btn');
    const instagramStatusNode = document.getElementById('settings-instagram-status');
    const instagramBtn = document.getElementById('settings-instagram-btn');
    const googleStatusNode = document.getElementById('settings-google-status');
    const googleBtn = document.getElementById('settings-google-btn');
    const togglePasswordButtons = Array.from(document.querySelectorAll('.toggle-password'));
    const navDashboardLink = document.getElementById('settings-nav-dashboard');
    const navCalendarLink = document.getElementById('settings-nav-calendar');

    const defaultState = {
        profile: {},
        account: {
            email: '',
            phone: '',
            socialAccounts: {
                instagram: { connected: false, handle: '' },
                google: { connected: false, handle: '' }
            }
        },
        notifications: {
            bookingRequests: true,
            directMessages: true,
            smsAlerts: false,
            marketingUpdates: false
        }
    };

    const stored = readStoredState();
    const state = {
        profile: stored.profile || {},
        account: {
            ...defaultState.account,
            ...(stored.account || {}),
            socialAccounts: {
                ...defaultState.account.socialAccounts,
                ...((stored.account || {}).socialAccounts || {})
            }
        },
        notifications: { ...defaultState.notifications, ...(stored.notifications || {}) }
    };

    function readStoredState() {
        try {
            return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
        } catch {
            return {};
        }
    }

    function saveState() {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function showToast(message, tone = 'neutral') {
        let toast = document.getElementById('settings-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'settings-toast';
            toast.className = 'fixed bottom-6 right-6 z-[120] max-w-sm text-sm font-semibold rounded-xl px-4 py-3 shadow-lg border transition';
            document.body.appendChild(toast);
        }

        toast.classList.remove('bg-white', 'text-slate-900', 'border-gray-200', 'bg-emerald-50', 'text-emerald-700', 'border-emerald-200', 'bg-red-50', 'text-red-700', 'border-red-200', 'opacity-0', 'translate-y-2');
        if (tone === 'success') {
            toast.classList.add('bg-emerald-50', 'text-emerald-700', 'border-emerald-200');
        } else if (tone === 'error') {
            toast.classList.add('bg-red-50', 'text-red-700', 'border-red-200');
        } else {
            toast.classList.add('bg-white', 'text-slate-900', 'border-gray-200');
        }

        toast.textContent = message;
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-2');
        }, 2200);
    }

    function applyRoleNavigation() {
        if (!navDashboardLink || !navCalendarLink || !window.LensWorksStore) {
            return;
        }

        const session = window.LensWorksStore.getSession();
        const role = String(session?.role || '').toLowerCase();
        const isVendor = role === 'vendor';

        navDashboardLink.href = isVendor ? 'vendor-dashboard.html' : 'client-dashboard.html';
        navCalendarLink.href = isVendor ? 'vendor-dashboard.html' : 'client-dashboard.html';
        navCalendarLink.textContent = isVendor ? 'Calendar' : 'My Dashboard';

        applyRoleScopedProfileUX(isVendor);
    }

    function applyRoleScopedProfileUX(isVendor) {
        const studioField = document.getElementById('profile-studio-field');
        const taglineField = document.getElementById('profile-tagline-field');
        const descNode = document.getElementById('profile-tab-description');
        const bioLabel = document.getElementById('profile-bio-label');
        const bioTextarea = document.getElementById('profile-bio-textarea');

        if (isVendor) {
            if (studioField) studioField.classList.remove('hidden');
            if (taglineField) taglineField.classList.remove('hidden');
            if (descNode) descNode.textContent = 'This is how you will appear to clients browsing the directory.';
            if (bioLabel) bioLabel.textContent = 'Full Biography';
            if (bioTextarea) bioTextarea.placeholder = 'Tell clients about your approach, experience, and what sessions you specialize in.';
        } else {
            // Client: hide vendor-only fields, soften copy
            if (studioField) studioField.classList.add('hidden');
            if (taglineField) taglineField.classList.add('hidden');
            if (descNode) descNode.textContent = 'Keep your profile up to date so vendors can reach you easily.';
            if (bioLabel) bioLabel.textContent = 'About You (optional)';
            if (bioTextarea) bioTextarea.placeholder = 'Tell us a bit about what you are looking for — style, budget range, or upcoming events.';
        }
    }

    async function hydrateAccountIdentity() {
        if (!accountEmailNode) {
            return;
        }

        const session = window.LensWorksStore?.getSession?.() || {};
        let email = String(session?.email || '').trim();

        if (!email && window.LensWorksApi?.auth?.me) {
            const meResult = await window.LensWorksApi.auth.me();
            if (meResult.ok) {
                email = String(meResult.payload?.data?.user?.email || '').trim();
            }
        }

        accountEmailNode.textContent = email || 'Not available';
        if (!state.account.email && email) {
            state.account.email = email;
            saveState();
        }
    }

    function styleSocialButton(button, connected) {
        if (!button) {
            return;
        }

        button.textContent = connected ? 'Disconnect' : 'Connect';
        button.classList.remove('text-red-600', 'hover:text-red-700', 'hover:bg-red-50', 'text-slate-900', 'border-gray-200', 'bg-white');

        if (connected) {
            button.classList.add('text-red-600', 'hover:text-red-700', 'hover:bg-red-50');
        } else {
            button.classList.add('text-slate-900', 'border-gray-200', 'bg-white');
        }
    }

    function applyAccountState() {
        const account = state.account || defaultState.account;
        const socials = account.socialAccounts || defaultState.account.socialAccounts;

        if (accountEmailNode) {
            accountEmailNode.textContent = account.email || 'Not available';
        }

        if (accountPhoneNode) {
            accountPhoneNode.textContent = account.phone || 'Not available';
        }

        if (instagramStatusNode) {
            const instagram = socials.instagram || { connected: false, handle: '' };
            instagramStatusNode.textContent = instagram.connected
                ? (instagram.handle || 'Connected')
                : 'Not connected';
        }

        if (googleStatusNode) {
            const google = socials.google || { connected: false, handle: '' };
            googleStatusNode.textContent = google.connected
                ? (google.handle || 'Connected with Google')
                : 'Not connected';
        }

        styleSocialButton(instagramBtn, Boolean(socials.instagram?.connected));
        styleSocialButton(googleBtn, Boolean(socials.google?.connected));
    }

    function setActiveTab(target) {
        tabButtons.forEach((button) => {
            const active = button.dataset.target === target;
            button.classList.toggle('bg-slate-900', active);
            button.classList.toggle('text-white', active);
            button.classList.toggle('shadow-md', active);
            if (active) {
                button.classList.remove('text-slate-600', 'hover:bg-slate-50', 'bg-white', 'border-gray-200', 'bg-transparent');
            } else if (window.innerWidth >= 1024) {
                button.classList.add('text-slate-600', 'hover:bg-slate-50', 'bg-transparent');
                button.classList.remove('bg-white', 'border-gray-200', 'border-transparent');
            } else {
                button.classList.add('text-slate-600', 'bg-white', 'border-gray-200');
                button.classList.remove('border-transparent', 'bg-transparent');
            }
        });

        tabContents.forEach((section) => {
            const active = section.id === `tab-${target}`;
            section.classList.toggle('visible-fade', active);
            section.classList.toggle('hidden-fade', !active);
        });

        const activeButton = tabButtons.find((button) => button.dataset.target === target);
        if (activeButton && window.innerWidth < 1024) {
            activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }

        if (window.location.hash !== `#${target}`) {
            window.history.replaceState(null, '', `#${target}`);
        }
    }

    function getInitialTarget() {
        const hash = String(window.location.hash || '').replace('#', '').trim().toLowerCase();
        const allowed = new Set(['profile', 'account', 'security', 'notifications', 'billing']);
        return allowed.has(hash) ? hash : 'profile';
    }

    function parseProfileForm() {
        const form = profileTab ? profileTab.querySelector('form') : null;
        if (!form) {
            return null;
        }

        const textInputs = Array.from(form.querySelectorAll('input[type="text"]'));
        const textArea = form.querySelector('textarea');

        return {
            form,
            firstName: textInputs[0],
            lastName: textInputs[1],
            studioName: textInputs[2],
            tagline: textInputs[3],
            location: textInputs[4],
            biography: textArea
        };
    }

    const profile = parseProfileForm();
    applyRoleNavigation();

    function loadProfileDraft() {
        if (!profile) {
            return;
        }

        const mapping = {
            firstName: profile.firstName,
            lastName: profile.lastName,
            studioName: profile.studioName,
            tagline: profile.tagline,
            location: profile.location,
            biography: profile.biography
        };

        Object.entries(mapping).forEach(([key, field]) => {
            if (field && typeof state.profile[key] === 'string') {
                field.value = state.profile[key];
            }
        });
    }

    async function loadSettingsFromApi() {
        if (!window.LensWorksApi || !window.LensWorksApi.account || !profile) {
            return;
        }

        const result = await window.LensWorksApi.account.getSettings();
        if (!result.ok) {
            return;
        }

        const data = result.payload?.data || {};
        const remoteProfile = data.profile || {};
        const remoteAccount = data.account || {};
        const remoteNotifications = data.notifications || {};

        const mapping = {
            firstName: profile.firstName,
            lastName: profile.lastName,
            studioName: profile.studioName,
            tagline: profile.tagline,
            location: profile.location,
            biography: profile.biography
        };

        Object.entries(mapping).forEach(([key, field]) => {
            if (field && typeof remoteProfile[key] === 'string' && remoteProfile[key].trim()) {
                field.value = remoteProfile[key];
                state.profile[key] = remoteProfile[key];
            }
        });

        state.notifications = {
            ...state.notifications,
            ...remoteNotifications
        };

        state.account = {
            ...state.account,
            ...remoteAccount,
            socialAccounts: {
                ...state.account.socialAccounts,
                ...(remoteAccount.socialAccounts || {})
            }
        };

        saveState();
        applyAccountState();
    }

    function collectProfileValues() {
        if (!profile) {
            return null;
        }

        return {
            firstName: profile.firstName ? profile.firstName.value.trim() : '',
            lastName: profile.lastName ? profile.lastName.value.trim() : '',
            studioName: profile.studioName ? profile.studioName.value.trim() : '',
            tagline: profile.tagline ? profile.tagline.value.trim() : '',
            location: profile.location ? profile.location.value.trim() : '',
            biography: profile.biography ? profile.biography.value.trim() : ''
        };
    }

    function validateProfile(values) {
        const session = window.LensWorksStore?.getSession?.() || {};
        const isVendor = String(session?.role || '').toLowerCase() === 'vendor';

        if (!values.firstName || !values.lastName) {
            return 'First and last name are required.';
        }
        if (!values.location) {
            return 'Location is required.';
        }
        if (isVendor && values.biography.length < 40) {
            return 'Biography should be at least 40 characters so clients can learn about you.';
        }
        if (isVendor && values.tagline.length > 60) {
            return 'Tagline must be 60 characters or fewer.';
        }
        return '';
    }

    function setButtonLoading(button, loadingText) {
        const original = button.innerHTML;
        button.disabled = true;
        button.classList.add('pointer-events-none');
        button.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin mr-2"></i> ${loadingText}`;
        window.refreshLensWorksIcons();

        return () => {
            button.innerHTML = original;
            button.disabled = false;
            button.classList.remove('pointer-events-none');
            window.refreshLensWorksIcons();
        };
    }

    function wireProfileSave() {
        if (!saveProfileButton || !profile) {
            return;
        }

        const cancelButton = profileTab.querySelector('button:not(#save-profile-btn)');

        saveProfileButton.addEventListener('click', () => {
            const values = collectProfileValues();
            const error = validateProfile(values);
            if (error) {
                showToast(error, 'error');
                return;
            }

            const release = setButtonLoading(saveProfileButton, 'Saving...');
            window.LensWorksApi.account.updateProfile(values).then((result) => {
                state.profile = values;
                saveState();
                release();

                if (result.ok) {
                    showToast('Profile changes saved to your account.', 'success');
                } else {
                    showToast('Profile saved locally. Sign in to persist server-side.', 'neutral');
                }
            });
        });

        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                loadProfileDraft();
                showToast('Unsaved profile edits were discarded.', 'neutral');
            });
        }
    }

    function wireAccountActions() {
        if (!accountTab) {
            return;
        }

        const emailButton = Array.from(accountTab.querySelectorAll('button')).find((button) => button.textContent.includes('Change Email'));

        if (emailButton) {
            emailButton.addEventListener('click', async () => {
                const nextEmail = window.prompt('Enter your new email address:', state.account.email || '');
                if (!nextEmail) {
                    return;
                }

                const trimmed = nextEmail.trim();
                const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
                if (!validEmail) {
                    showToast('Please enter a valid email address.', 'error');
                    return;
                }

                const result = await window.LensWorksApi.account.updateContact({ email: trimmed });
                if (!result.ok) {
                    const message = result.error?.payload?.message || 'Email update failed.';
                    showToast(message, 'error');
                    return;
                }

                state.account = {
                    ...state.account,
                    ...(result.payload?.data?.account || {})
                };
                saveState();
                applyAccountState();

                if (window.LensWorksStore?.setSession) {
                    const session = window.LensWorksStore.getSession?.() || {};
                    window.LensWorksStore.setSession({
                        ...(session || {}),
                        email: state.account.email || trimmed
                    });
                }

                showToast('Email updated.', 'success');
            });
        }

        if (phoneUpdateBtn) {
            phoneUpdateBtn.addEventListener('click', async () => {
                const nextPhone = window.prompt('Enter your phone number (with country code):', state.account.phone || '');
                if (!nextPhone) {
                    return;
                }

                const normalized = nextPhone.trim();
                const result = await window.LensWorksApi.account.updateContact({ phone: normalized });
                if (!result.ok) {
                    const message = result.error?.payload?.message || 'Phone update failed.';
                    showToast(message, 'error');
                    return;
                }

                state.account = {
                    ...state.account,
                    ...(result.payload?.data?.account || {})
                };
                saveState();
                applyAccountState();
                showToast('Phone number updated.', 'success');
            });
        }

        if (instagramBtn) {
            instagramBtn.addEventListener('click', async () => {
                const currentlyConnected = Boolean(state.account.socialAccounts?.instagram?.connected);
                let handle = '';
                if (!currentlyConnected) {
                    const nextHandle = window.prompt('Enter Instagram handle (example: @mybrand):', state.account.socialAccounts?.instagram?.handle || '');
                    if (!nextHandle) {
                        return;
                    }
                    handle = nextHandle.trim();
                }

                const result = await window.LensWorksApi.account.updateSocial({
                    platform: 'instagram',
                    connected: !currentlyConnected,
                    handle
                });

                if (!result.ok) {
                    const message = result.error?.payload?.message || 'Instagram update failed.';
                    showToast(message, 'error');
                    return;
                }

                state.account = {
                    ...state.account,
                    ...(result.payload?.data?.account || {}),
                    socialAccounts: {
                        ...state.account.socialAccounts,
                        ...(result.payload?.data?.account?.socialAccounts || {})
                    }
                };
                saveState();
                applyAccountState();
                showToast(currentlyConnected ? 'Instagram disconnected.' : 'Instagram connected.', 'success');
            });
        }

        if (googleBtn) {
            googleBtn.addEventListener('click', async () => {
                const currentlyConnected = Boolean(state.account.socialAccounts?.google?.connected);
                const result = await window.LensWorksApi.account.updateSocial({
                    platform: 'google',
                    connected: !currentlyConnected,
                    handle: !currentlyConnected ? 'Connected with Google' : ''
                });

                if (!result.ok) {
                    const message = result.error?.payload?.message || 'Google account update failed.';
                    showToast(message, 'error');
                    return;
                }

                state.account = {
                    ...state.account,
                    ...(result.payload?.data?.account || {}),
                    socialAccounts: {
                        ...state.account.socialAccounts,
                        ...(result.payload?.data?.account?.socialAccounts || {})
                    }
                };
                saveState();
                applyAccountState();
                showToast(currentlyConnected ? 'Google disconnected.' : 'Google connected.', 'success');
            });
        }
    }

    function wireSecurityForm() {
        if (!securityTab) {
            return;
        }

        const form = securityTab.querySelector('form');
        const passwordInputs = Array.from(securityTab.querySelectorAll('.password-input'));
        if (!form || passwordInputs.length < 3) {
            return;
        }

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const [currentPassword, newPassword, confirmPassword] = passwordInputs.map((field) => field.value.trim());

            if (!currentPassword || !newPassword || !confirmPassword) {
                showToast('Please complete all password fields.', 'error');
                return;
            }

            if (newPassword.length < 8) {
                showToast('New password must be at least 8 characters.', 'error');
                return;
            }

            if (newPassword !== confirmPassword) {
                showToast('Password confirmation does not match.', 'error');
                return;
            }

            const submitButton = form.querySelector('button');
            const release = submitButton ? setButtonLoading(submitButton, 'Updating...') : () => {};

            window.LensWorksApi.account
                .updatePassword({ currentPassword, newPassword })
                .then((result) => {
                    release();

                    if (!result.ok) {
                        const message = result.error?.payload?.message || 'Password update failed.';
                        showToast(message, 'error');
                        return;
                    }

                    passwordInputs.forEach((field) => {
                        field.value = '';
                        field.type = 'password';
                    });
                    togglePasswordButtons.forEach((button) => {
                        const icon = button.querySelector('i');
                        icon.setAttribute('data-lucide', 'eye');
                        button.classList.remove('text-slate-900');
                        button.classList.add('text-gray-400');
                    });
                    window.refreshLensWorksIcons();
                    showToast('Password updated successfully.', 'success');
                });
        });
    }

    function wireNotificationPreferences() {
        if (!notificationsTab) {
            return;
        }

        const toggles = Array.from(notificationsTab.querySelectorAll('input[type="checkbox"]'));
        const keys = ['bookingRequests', 'directMessages', 'smsAlerts', 'marketingUpdates'];

        toggles.forEach((toggle, index) => {
            const key = keys[index];
            if (!key) {
                return;
            }
            toggle.checked = Boolean(state.notifications[key]);
            toggle.addEventListener('change', () => {
                state.notifications[key] = toggle.checked;
                saveState();
                window.LensWorksApi.account.updateNotifications(state.notifications).then((result) => {
                    if (result.ok) {
                        showToast('Notification preference updated.', 'success');
                    } else {
                        showToast('Saved locally. Sign in to sync preferences.', 'neutral');
                    }
                });
            });
        });
    }

    function wireBillingActions() {
        if (!billingTab) {
            return;
        }

        const manageButton = Array.from(billingTab.querySelectorAll('button')).find((button) => button.textContent.includes('Stripe Dashboard'));
        const updateBankButton = Array.from(billingTab.querySelectorAll('button')).find((button) => button.textContent.includes('Update Bank Account'));

        if (manageButton) {
            manageButton.addEventListener('click', () => {
                showToast('Stripe dashboard link will open after backend connect.', 'neutral');
            });
        }

        if (updateBankButton) {
            updateBankButton.addEventListener('click', () => {
                showToast('Bank account update request captured for review.', 'success');
            });
        }
    }

    togglePasswordButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            const icon = button.querySelector('i');
            if (!input || !icon) {
                return;
            }

            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
            button.classList.toggle('text-slate-900', isPassword);
            button.classList.toggle('text-gray-400', !isPassword);
            window.refreshLensWorksIcons();
        });
    });

    tabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            setActiveTab(button.dataset.target);
        });
    });

    window.addEventListener('hashchange', () => {
        const target = getInitialTarget();
        setActiveTab(target);
    });

    window.addEventListener('resize', () => {
        const active = tabButtons.find((button) => button.classList.contains('bg-slate-900'));
        setActiveTab(active ? active.dataset.target : 'profile');
    });

    loadProfileDraft();
    hydrateAccountIdentity();
    applyAccountState();
    loadSettingsFromApi();
    wireProfileSave();
    wireAccountActions();
    wireSecurityForm();
    wireNotificationPreferences();
    wireBillingActions();
    setActiveTab(getInitialTarget());
});