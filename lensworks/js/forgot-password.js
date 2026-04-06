document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('forgot-password-email');
    const submitBtn = document.getElementById('forgot-password-btn');
    const status = document.getElementById('forgot-password-status');

    function setStatus(message, tone = 'neutral') {
        status.textContent = message;
        status.classList.remove('hidden', 'text-red-600', 'border-red-200', 'bg-red-50', 'text-green-700', 'border-green-200', 'bg-green-50', 'text-gray-600', 'border-gray-200', 'bg-gray-50');

        if (tone === 'error') {
            status.classList.add('text-red-600', 'border-red-200', 'bg-red-50');
        } else if (tone === 'success') {
            status.classList.add('text-green-700', 'border-green-200', 'bg-green-50');
        } else {
            status.classList.add('text-gray-600', 'border-gray-200', 'bg-gray-50');
        }
    }

    if (!submitBtn || !emailInput) {
        return;
    }

    submitBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        if (!email) {
            emailInput.focus();
            return;
        }

        submitBtn.disabled = true;
        setStatus('Submitting password reset request...', 'neutral');

        const result = await window.LensWorksApi.auth.forgotPassword({ email });
        if (result.ok) {
            setStatus('If an account exists for this email, reset instructions have been prepared.', 'success');
        } else {
            setStatus('Password reset delivery is not active yet in this demo environment.', 'neutral');
        }

        submitBtn.disabled = false;
    });
});
