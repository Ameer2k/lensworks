document.addEventListener('DOMContentLoaded', () => {
    const year = document.getElementById('info-year');
    if (year) {
        year.textContent = new Date().getFullYear();
    }
});
