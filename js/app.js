/**
 * Fitness Journey MED - Core Functionality
 */

(function () {
    'use strict';

    // UI Configuration & State
    const App = {
        async init() {
            console.log("Fitness Journey initialized.");

            this.bindEvents();

            // Check auth state
            try {
                const session = await window.FitnessAuth.getSession();
                if (session) {
                    this.showDashboard(session.user);
                } else {
                    this.showLogin();
                }

                // Listen for changes
                window.FitnessAuth.onAuthStateChange((event, session) => {
                    if (event === 'SIGNED_IN') this.showDashboard(session.user);
                    if (event === 'SIGNED_OUT') this.showLogin();
                });
            } catch (err) {
                console.error("Auth init error:", err);
                this.showLogin();
            }
        },

        showLogin() {
            document.getElementById('login-view').style.display = 'flex';
            document.getElementById('app-header').style.display = 'none';
            document.getElementById('main-view').style.display = 'none';
            document.getElementById('bottom-nav').style.display = 'none';
        },

        showDashboard(user) {
            document.getElementById('login-view').style.display = 'none';
            document.getElementById('app-header').style.display = 'flex';
            document.getElementById('main-view').style.display = 'block';
            document.getElementById('bottom-nav').style.display = 'flex';

            // Reset to dashboard view
            this.navigateTo('dashboard-view');

            // Basic User UI
            if (user && user.email) {
                const firstLetter = user.email.charAt(0).toUpperCase();
                document.getElementById('user-avatar').textContent = firstLetter;
                document.getElementById('user-name').textContent = user.email.split('@')[0];
            }

            this.animateRings();
        },

        navigateTo(viewId) {
            // Hide all views inside main
            const views = document.querySelectorAll('#main-view > div');
            views.forEach(v => v.style.display = 'none');

            // Show target
            const target = document.getElementById(viewId);
            if (target) {
                target.style.display = 'block';
            }
            window.scrollTo(0, 0);

            // If navigating to nutrition and the module exists, init it
            if (viewId === 'nutrition-view' && window.NutritionModule) {
                window.NutritionModule.render();
            }
            // If navigating to photo and the module exists, init it
            if (viewId === 'photo-view' && window.PhotoModule) {
                window.PhotoModule.render();
            }
            // If navigating to workout and the module exists, init it
            if (viewId === 'workout-view' && window.WorkoutModule) {
                window.WorkoutModule.render();
            }
            // If navigating to cardio and the module exists, init it
            if (viewId === 'cardio-view' && window.CardioModule) {
                window.CardioModule.render();
            }
            // If navigating to profile and the module exists, init it
            if (viewId === 'profile-view' && window.ProfileModule) {
                window.ProfileModule.render();
            }
        },

        bindEvents() {
            // Login Form
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const email = document.getElementById('login-email').value.trim();
                    const password = document.getElementById('login-password').value;
                    const btn = document.getElementById('login-btn');
                    const errorMsg = document.getElementById('login-error');

                    btn.disabled = true;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Entrando...';
                    errorMsg.style.display = 'none';

                    try {
                        await window.FitnessAuth.login(email, password);
                        // showDashboard handle automatically by onAuthStateChange event
                    } catch (err) {
                        errorMsg.textContent = 'Erro ao logar: ' + err.message;
                        errorMsg.style.display = 'block';
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Entrar';
                    }
                });
            }

            // Logout Button
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    if (confirm("Deseja realmente sair?")) {
                        await window.FitnessAuth.logout();
                    }
                });
            }

            // Action cards mapping to routes/modals
            document.querySelectorAll('.action-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (card.classList.contains('photo')) {
                        this.navigateTo('photo-view');
                    } else if (card.classList.contains('workout')) {
                        this.navigateTo('workout-view');
                    } else if (card.classList.contains('cardio')) {
                        this.navigateTo('cardio-view');
                    } else {
                        const type = card.classList.contains('survival') ? 'survival' : 'learn';

                        alert(`Opening module: ${type.toUpperCase()}\n(Prototype: Integration pending)`);
                    }
                });
            });

            // Main Workout Card
            const workoutCard = document.querySelector('.workout-card');
            if (workoutCard) {
                workoutCard.addEventListener('click', () => {
                    this.navigateTo('workout-view');
                });
            }

            // Bottom Nav active state toggling
            const navItems = document.querySelectorAll('.nav-item:not(.primary-action)');
            navItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    navItems.forEach(nav => nav.classList.remove('active'));
                    item.classList.add('active');
                });
            });

            // FAB Action (Main "Plus" button)
            const fab = document.querySelector('.primary-action');
            if (fab) {
                fab.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Temporary route to Nutrition
                    this.navigateTo('nutrition-view');
                });
            }

            // View Routing Buttons
            document.getElementById('btn-goto-nutrition')?.addEventListener('click', () => this.navigateTo('nutrition-view'));
            document.getElementById('nav-nutrition')?.addEventListener('click', () => this.navigateTo('nutrition-view'));
            document.getElementById('nav-workout')?.addEventListener('click', () => this.navigateTo('workout-view'));
            document.getElementById('nav-profile')?.addEventListener('click', () => this.navigateTo('profile-view'));
            document.getElementById('nav-home')?.addEventListener('click', () => {
                this.navigateTo('dashboard-view');
                this.animateRings();
            });

            const goBackToDash = () => {
                this.navigateTo('dashboard-view');
                this.animateRings(); // Reanimate rings when coming back
            };

            document.getElementById('btn-back-dash')?.addEventListener('click', goBackToDash);
            document.getElementById('btn-back-dash-photo')?.addEventListener('click', goBackToDash);
            document.getElementById('btn-back-dash-workout')?.addEventListener('click', goBackToDash);
            document.getElementById('btn-back-dash-cardio')?.addEventListener('click', goBackToDash);
            document.getElementById('btn-back-dash-profile')?.addEventListener('click', goBackToDash);
            document.querySelector('.nav-item.active')?.addEventListener('click', () => {
                this.navigateTo('dashboard-view');
                this.animateRings();
            });
        },

        animateRings() {
            setTimeout(() => {
                const ring = document.querySelector('.ring-progress');
                if (ring) {
                    ring.style.strokeDashoffset = '120';
                }

                document.querySelectorAll('.progress-bar .fill').forEach(bar => {
                    const targetWidth = bar.style.width || bar.getAttribute('style').match(/width:\s*(\d+%)/)[1];
                    bar.style.width = '0%';
                    requestAnimationFrame(() => {
                        setTimeout(() => {
                            bar.style.transition = 'width 1s ease-out';
                            bar.style.width = targetWidth;
                        }, 50);
                    });
                });
            }, 300);
        }
    };

    // Auto-init on DOM load
    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });

    // Expose for external modules if needed
    window.FitnessApp = App;
})();
