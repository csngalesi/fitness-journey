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

            // Basic User UI
            if (user && user.email) {
                const firstLetter = user.email.charAt(0).toUpperCase();
                document.getElementById('user-avatar').textContent = firstLetter;
                document.getElementById('user-name').textContent = user.email.split('@')[0];
            }

            this.animateRings();
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
                    const type = card.classList.contains('survival') ? 'survival' :
                        card.classList.contains('cardio') ? 'cardio' :
                            card.classList.contains('photo') ? 'photo' : 'learn';

                    alert(`Opening module: ${type.toUpperCase()}\n(Prototype: Integration pending)`);
                });
            });

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
                    alert("Opening Quick Add Menu:\n- Log Meal\n- Start Workout\n- Take Photo");
                });
            }
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
