// Navbar Scroll Logic
        document.addEventListener('DOMContentLoaded', () => {
            const navbar = document.getElementById('navbar');
            const logoIcon = document.getElementById('nav-logo-icon');
            const signupBtn = document.getElementById('signup-btn');
            const heroSearchForm = document.getElementById('hero-search-form');
            const heroServiceInput = document.getElementById('hero-service');
            const heroLocationInput = document.getElementById('hero-location');
            const heroDateInput = document.getElementById('hero-date');

            window.addEventListener('scroll', () => {
                if (window.scrollY > 50) {
                    // Scrolled state
                    navbar.classList.remove('bg-transparent', 'py-6', 'text-white');
                    navbar.classList.add('bg-white/90', 'backdrop-blur-md', 'shadow-sm', 'py-4', 'text-slate-900');
                    
                    // Specific element color shifts
                    logoIcon.classList.remove('text-white');
                    logoIcon.classList.add('text-slate-900');
                    
                    signupBtn.classList.remove('bg-white', 'text-slate-900');
                    signupBtn.classList.add('bg-slate-900', 'text-white');
                } else {
                    // Top state
                    navbar.classList.add('bg-transparent', 'py-6', 'text-white');
                    navbar.classList.remove('bg-white/90', 'backdrop-blur-md', 'shadow-sm', 'py-4', 'text-slate-900');
                    
                    // Specific element color shifts
                    logoIcon.classList.add('text-white');
                    logoIcon.classList.remove('text-slate-900');
                    
                    signupBtn.classList.add('bg-white', 'text-slate-900');
                    signupBtn.classList.remove('bg-slate-900', 'text-white');
                }
            });

            if (heroSearchForm) {
                heroSearchForm.addEventListener('submit', (event) => {
                    event.preventDefault();

                    const params = new URLSearchParams();
                    const service = String(heroServiceInput?.value || '').trim();
                    const location = String(heroLocationInput?.value || '').trim();
                    const date = String(heroDateInput?.value || '').trim();

                    if (service) {
                        params.set('service', service);
                    }
                    if (location) {
                        params.set('location', location);
                    }
                    if (date) {
                        params.set('date', date);
                    }

                    window.location.href = `directory.html${params.toString() ? `?${params.toString()}` : ''}`;
                });
            }
        });

        // Newsletter
        function handleNewsletter(e) {
            e.preventDefault();
            const email = document.getElementById('newsletter-email').value.trim();
            if (!email) return;
            document.getElementById('newsletter-msg').classList.remove('hidden');
            document.getElementById('newsletter-email').value = '';
        }