document.addEventListener('DOMContentLoaded', () => {
    let isLogin = true;
    let role = 'client';

    const formTitle = document.getElementById('form-title');
    const formSubtitle = document.getElementById('form-subtitle');
    const roleSelector = document.getElementById('role-selector');
    const nameField = document.getElementById('name-field');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const submitBtnText = document.getElementById('submit-btn-text');
    const togglePrompt = document.getElementById('toggle-prompt');
    const toggleAuthBtn = document.getElementById('toggle-auth-btn');
    const authBg = document.getElementById('auth-bg');
    const authQuote = document.getElementById('auth-quote');
    const btnClient = document.getElementById('role-client');
    const btnVendor = document.getElementById('role-vendor');
    const authForm = document.getElementById('auth-form');
    const submitBtn = document.getElementById('auth-submit-btn');
    const nameInput = document.getElementById('auth-name');
    const emailInput = document.getElementById('auth-email');
    const passwordInput = document.getElementById('auth-password');
    const authStatus = document.getElementById('auth-status');

    function setStatus(message, tone = 'neutral') {
        authStatus.textContent = message;
        authStatus.classList.remove('hidden', 'text-red-600', 'border-red-200', 'bg-red-50', 'text-green-700', 'border-green-200', 'bg-green-50', 'text-gray-600', 'border-gray-200', 'bg-gray-50');

        if (tone === 'error') {
            authStatus.classList.add('text-red-600', 'border-red-200', 'bg-red-50');
        } else if (tone === 'success') {
            authStatus.classList.add('text-green-700', 'border-green-200', 'bg-green-50');
        } else {
            authStatus.classList.add('text-gray-600', 'border-gray-200', 'bg-gray-50');
        }
    }

    function routeToDashboard(currentRole) {
        window.location.href = currentRole === 'vendor' ? 'vendor-dashboard.html' : 'client-dashboard.html';
    }

    function setSession(mode, resolvedRole = role, resolvedName = '') {
        window.LensWorksStore.setSession({
            role: resolvedRole,
            email: emailInput.value.trim(),
            name: resolvedName || nameInput.value.trim() || 'LensWorks User',
            mode,
            loggedInAt: new Date().toISOString()
        });
    }

    function updateBackground(state) {
        if (state === 'login' || state === 'client') {
            authBg.style.backgroundImage = "url('https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=2578&auto=format&fit=crop')";
            authQuote.innerHTML = `
                <h2 class="text-4xl font-bold text-white mb-4 leading-tight">Find the perfect lens for your story.</h2>
                <p class="text-gray-300 text-lg">Join thousands of clients discovering top-tier photographers and studios for their most important moments.</p>
            `;
        } else {
            authBg.style.backgroundImage = "url('https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2000&auto=format&fit=crop')";
            authQuote.innerHTML = `
                <h2 class="text-4xl font-bold text-white mb-4 leading-tight">Grow your photography business.</h2>
                <p class="text-gray-300 text-lg">Set your rates, manage your bookings, and showcase your portfolio to thousands of potential clients daily.</p>
            `;
        }
    }

    function selectRole(selectedRole) {
        role = selectedRole;

        btnClient.classList.toggle('border-slate-900', role === 'client');
        btnClient.classList.toggle('bg-slate-50', role === 'client');
        btnClient.classList.toggle('border-gray-200', role !== 'client');
        btnClient.classList.toggle('opacity-60', role !== 'client');
        btnClient.querySelector('i').classList.toggle('text-slate-900', role === 'client');
        btnClient.querySelector('i').classList.toggle('text-gray-500', role !== 'client');
        btnClient.querySelector('span').classList.toggle('text-slate-900', role === 'client');
        btnClient.querySelector('span').classList.toggle('text-gray-600', role !== 'client');

        btnVendor.classList.toggle('border-slate-900', role === 'vendor');
        btnVendor.classList.toggle('bg-slate-50', role === 'vendor');
        btnVendor.classList.toggle('border-gray-200', role !== 'vendor');
        btnVendor.classList.toggle('opacity-60', role !== 'vendor');
        btnVendor.querySelector('i').classList.toggle('text-slate-900', role === 'vendor');
        btnVendor.querySelector('i').classList.toggle('text-gray-500', role !== 'vendor');
        btnVendor.querySelector('span').classList.toggle('text-slate-900', role === 'vendor');
        btnVendor.querySelector('span').classList.toggle('text-gray-600', role !== 'vendor');

        updateBackground(role);
    }

    function toggleAuthMode() {
        isLogin = !isLogin;
        authStatus.classList.add('hidden');

        if (isLogin) {
            formTitle.innerText = 'Welcome Back';
            formSubtitle.innerText = 'Log in to your account to continue.';
            roleSelector.classList.add('hidden');
            nameField.classList.add('hidden');
            forgotPasswordLink.classList.remove('hidden');
            submitBtnText.innerText = 'Log In';
            togglePrompt.innerText = "Don't have an account?";
            toggleAuthBtn.innerText = 'Sign up';
            updateBackground('login');
        } else {
            formTitle.innerText = 'Create an Account';
            formSubtitle.innerText = 'Join the platform today.';
            roleSelector.classList.remove('hidden');
            nameField.classList.remove('hidden');
            forgotPasswordLink.classList.add('hidden');
            submitBtnText.innerText = 'Create Account';
            togglePrompt.innerText = 'Already have an account?';
            toggleAuthBtn.innerText = 'Log in';
            updateBackground(role);
        }
    }

    async function handleSubmit() {
        if (!emailInput.value.trim()) {
            emailInput.focus();
            return;
        }

        if (!passwordInput.value.trim()) {
            passwordInput.focus();
            return;
        }

        if (!isLogin && !nameInput.value.trim()) {
            nameInput.focus();
            return;
        }

        submitBtn.disabled = true;
        setStatus(isLogin ? 'Contacting backend...' : 'Creating your account...', 'neutral');

        const payload = isLogin
            ? {
                email: emailInput.value.trim(),
                password: passwordInput.value.trim()
            }
            : {
                email: emailInput.value.trim(),
                password: passwordInput.value.trim(),
                fullName: nameInput.value.trim(),
                role
            };

        const result = isLogin
            ? await window.LensWorksApi.auth.login(payload)
            : await window.LensWorksApi.auth.register(payload);

        if (!result.ok) {
            const message = result.error?.payload?.message || 'Unable to authenticate right now. Please try again.';
            setStatus(message, 'error');
            submitBtn.disabled = false;
            return;
        }

        const apiRole = String(result.payload?.data?.user?.role || role).toLowerCase() === 'vendor' ? 'vendor' : 'client';
        const apiName = String(result.payload?.data?.user?.fullName || '').trim();
        setSession('api', apiRole, apiName);
        setStatus(isLogin ? 'Logged in successfully.' : 'Account created successfully.', 'success');
        setTimeout(() => routeToDashboard(apiRole), 500);

        submitBtn.disabled = false;
    }

    toggleAuthBtn.addEventListener('click', toggleAuthMode);
    submitBtn.addEventListener('click', handleSubmit);
    btnClient.addEventListener('click', () => selectRole('client'));
    btnVendor.addEventListener('click', () => selectRole('vendor'));

    selectRole('client');
});