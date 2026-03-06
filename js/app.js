/**
 * Fitness Journey MED - Core Functionality
 */

(function () {
    'use strict';

    // UI Configuration & State
    const App = {
        init() {
            console.log("Fitness Journey initialized.");
            this.bindEvents();
            this.animateRings();
        },

        bindEvents() {
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
            // Initial animation for the calories ring
            setTimeout(() => {
                const ring = document.querySelector('.ring-progress');
                if (ring) {
                    // Assuming Math: circumference = 2 * pi * r = ~282
                    // Setting offset directly on DOM element for prototype feel
                    ring.style.strokeDashoffset = '120'; // ~60% filled
                }

                // Initial animation for macro bars
                document.querySelectorAll('.progress-bar .fill').forEach(bar => {
                    const targetWidth = bar.style.width;
                    bar.style.width = '0%';
                    setTimeout(() => {
                        bar.style.width = targetWidth;
                    }, 100);
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
