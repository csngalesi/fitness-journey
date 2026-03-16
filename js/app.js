/**
 * Fitness Journey MED - Core Functionality
 */

(function () {
    'use strict';

    // Calorie targets per metabolic goal
    const META_CALS = { lose: 2000, maintain: 2200, gain: 2800, recomp: 2400 };
    const META_PRO  = { lose: 180,  maintain: 160,  gain: 200,  recomp: 190  };
    const META_CARB = { lose: 200,  maintain: 250,  gain: 350,  recomp: 250  };
    const META_FAT  = { lose: 55,   maintain: 65,   gain: 75,   recomp: 65   };

    const App = {
        _dashboardReady: false,

        async init() {
            console.log("Fitness Journey initialized.");

            this.bindEvents();

            try {
                const session = await window.FitnessAuth.getSession();
                if (session) {
                    this.showDashboard(session.user);
                } else {
                    this.showLogin();
                }

                window.FitnessAuth.onAuthStateChange((event, session) => {
                    if (event === 'SIGNED_IN')  this.showDashboard(session.user);
                    if (event === 'SIGNED_OUT') this.showLogin();
                });
            } catch (err) {
                console.error("Auth init error:", err);
                this.showLogin();
            }
        },

        showLogin() {
            this._dashboardReady = false;
            document.getElementById('login-view').style.display = 'flex';
            document.getElementById('app-header').style.display = 'none';
            document.getElementById('main-view').style.display = 'none';
            document.getElementById('bottom-nav').style.display = 'none';
        },

        showDashboard(user) {
            const firstLoad = !this._dashboardReady;
            this._dashboardReady = true;

            document.getElementById('login-view').style.display = 'none';
            document.getElementById('app-header').style.display = 'flex';
            document.getElementById('main-view').style.display = 'block';
            document.getElementById('bottom-nav').style.display = 'flex';

            if (user && user.email) {
                const firstLetter = user.email.charAt(0).toUpperCase();
                document.getElementById('user-avatar').textContent = firstLetter;
                document.getElementById('user-name').textContent = user.email.split('@')[0];
            }

            if (firstLoad) {
                this.navigateTo('dashboard-view');
                this.animateRings();
                this.loadDashboardData(user);
            }
        },

        async loadDashboardData(user) {
            try {
                const today = new Date().toISOString().split('T')[0];

                // Fetch profile for macro targets
                const { data: profile } = await window.supabaseClient
                    .from('profiles').select('metabolic_goal')
                    .eq('id', user.id).single();

                const goal = profile?.metabolic_goal || 'maintain';
                const metaCals = META_CALS[goal] || 2200;
                const metaPro  = META_PRO[goal]  || 160;
                const metaCarb = META_CARB[goal] || 250;
                const metaFat  = META_FAT[goal]  || 65;

                // Fetch today's nutrition logs
                const { data: nutLogs } = await window.supabaseClient
                    .from('nutrition_logs').select('total_calories, macros_json')
                    .eq('user_id', user.id).eq('log_date', today);

                const totCals = (nutLogs || []).reduce((s, l) => s + (l.total_calories || 0), 0);
                const totPro  = (nutLogs || []).reduce((s, l) => s + (l.macros_json?.pro  || 0), 0);
                const totCarb = (nutLogs || []).reduce((s, l) => s + (l.macros_json?.carb || 0), 0);
                const totFat  = (nutLogs || []).reduce((s, l) => s + (l.macros_json?.fat  || 0), 0);

                const remaining = Math.max(0, metaCals - totCals);

                // Update nutrition ring
                const ring = document.querySelector('.ring-progress');
                if (ring) {
                    const ratio = Math.min(totCals / metaCals, 1);
                    ring.style.strokeDashoffset = String(Math.round((1 - ratio) * 282));
                }

                const calsNumEl = document.querySelector('.cals-number');
                const calsLblEl = document.querySelector('.cals-label');
                if (calsNumEl) calsNumEl.textContent = remaining.toLocaleString('pt-BR');
                if (calsLblEl) calsLblEl.textContent = totCals === 0 ? 'Meta do dia' : 'Restantes';

                // Update macro bars
                this._updateMacroBar('.macro-item.pro',  totPro,  metaPro,  'pro');
                this._updateMacroBar('.macro-item.carb', totCarb, metaCarb, 'carb');
                this._updateMacroBar('.macro-item.fat',  totFat,  metaFat,  'fat');

                // Fetch last workout
                const { data: lastWk } = await window.supabaseClient
                    .from('workout_executions').select('workout_title, log_date')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1).single();

                const workoutInfoEl = document.querySelector('.workout-info');
                if (workoutInfoEl && lastWk) {
                    const h4 = workoutInfoEl.querySelector('h4');
                    const p  = workoutInfoEl.querySelector('p');
                    if (h4) h4.textContent = lastWk.workout_title || 'Treino registrado';
                    if (p) {
                        const days = Math.round((Date.now() - new Date(lastWk.log_date).getTime()) / 86400000);
                        p.textContent = days === 0 ? 'Hoje' : days === 1 ? 'Ontem' : `Há ${days} dias`;
                    }
                }
            } catch (err) {
                console.warn('[Dashboard] Could not load real data:', err);
            }
        },

        _updateMacroBar(selector, consumed, target, type) {
            const itemEl = document.querySelector(selector);
            if (!itemEl) return;
            const headerSpans = itemEl.querySelectorAll('.macro-header span');
            const fill = itemEl.querySelector('.progress-bar .fill');
            const pct = Math.min(Math.round((consumed / target) * 100), 100);
            if (headerSpans[1]) headerSpans[1].textContent = `${consumed} / ${target}g`;
            if (fill) {
                fill.style.transition = 'width 1s ease-out';
                fill.style.width = pct + '%';
            }
        },

        navigateTo(viewId) {
            const views = document.querySelectorAll('#main-view > div');
            views.forEach(v => v.style.display = 'none');

            const target = document.getElementById(viewId);
            if (target) target.style.display = 'block';
            window.scrollTo(0, 0);

            if (viewId === 'nutrition-view' && window.NutritionModule) window.NutritionModule.render();
            if (viewId === 'photo-view'     && window.PhotoModule)     window.PhotoModule.render();
            if (viewId === 'workout-view'   && window.WorkoutModule)   window.WorkoutModule.render();
            if (viewId === 'cardio-view'    && window.CardioModule)    window.CardioModule.render();
            if (viewId === 'profile-view'   && window.ProfileModule)   window.ProfileModule.render();
            if (viewId === 'survival-view'  && window.SurvivalModule)  window.SurvivalModule.render();
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

            // Action cards
            document.querySelectorAll('.action-card').forEach(card => {
                card.addEventListener('click', () => {
                    if (card.classList.contains('diet'))         this.navigateTo('nutrition-view');
                    else if (card.classList.contains('photo'))    this.navigateTo('photo-view');
                    else if (card.classList.contains('workout'))  this.navigateTo('workout-view');
                    else if (card.classList.contains('cardio'))   this.navigateTo('cardio-view');
                    else if (card.classList.contains('survival')) this.navigateTo('survival-view');
                });
            });

            // Main Workout Card
            const workoutCard = document.querySelector('.workout-card');
            if (workoutCard) workoutCard.addEventListener('click', () => this.navigateTo('workout-view'));

            // Bottom Nav
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    navItems.forEach(nav => nav.classList.remove('active'));
                    item.classList.add('active');
                });
            });

            // View routing
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
                this.animateRings();
            };

            document.getElementById('btn-back-dash')?.addEventListener('click', goBackToDash);
            document.getElementById('btn-back-dash-photo')?.addEventListener('click', goBackToDash);
            document.getElementById('btn-back-dash-workout')?.addEventListener('click', goBackToDash);
            document.getElementById('btn-back-dash-cardio')?.addEventListener('click', goBackToDash);
            document.getElementById('btn-back-dash-profile')?.addEventListener('click', goBackToDash);
            document.getElementById('btn-back-dash-survival')?.addEventListener('click', goBackToDash);
        },

        animateRings() {
            setTimeout(() => {
                document.querySelectorAll('.progress-bar .fill').forEach(bar => {
                    const style = bar.getAttribute('style') || '';
                    const match = style.match(/width:\s*(\d+%)/);
                    if (match) {
                        const target = match[1];
                        bar.style.width = '0%';
                        requestAnimationFrame(() => {
                            setTimeout(() => {
                                bar.style.transition = 'width 1s ease-out';
                                bar.style.width = target;
                            }, 50);
                        });
                    }
                });
            }, 300);
        }
    };

    document.addEventListener('DOMContentLoaded', () => { App.init(); });

    window.FitnessApp = App;
})();
