/**
 * Fitness Journey MED - Nutrition Module
 */

(function () {
    'use strict';

    const NutritionModule = {
        state: {
            targetCals: 2500,
            targetPro: 180,
            targetCarb: 300,
            targetFat: 60,
            consumedCals: 0,
            consumedPro: 0,
            consumedCarb: 0,
            consumedFat: 0,
            meals: []
        },

        render() {
            const container = document.getElementById('nutrition-content-area');

            // Render basic layout
            container.innerHTML = `
                <div class="macro-summary mb-3" style="font-size: 0.9rem;">
                    <strong>Metas de Hoje (Protótipo local)</strong><br>
                    <span style="color:var(--text-muted)">Cals: ${this.state.targetCals} | P: ${this.state.targetPro}g | C: ${this.state.targetCarb}g | F: ${this.state.targetFat}g</span>
                </div>
                
                <div class="form-group mt-4">
                    <input type="text" id="meal-desc" class="form-control" placeholder="Descreva a refeição...">
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.8rem; margin-bottom:1.5rem;">
                    <input type="number" id="meal-cals" class="form-control" placeholder="Kcal totais" style="text-align:center;">
                    <input type="number" id="meal-pro" class="form-control" placeholder="Pro (g)" style="text-align:center;">
                    <input type="number" id="meal-carb" class="form-control" placeholder="Carb (g)" style="text-align:center;">
                    <input type="number" id="meal-fat" class="form-control" placeholder="Gord (g)" style="text-align:center;">
                </div>
                <button class="btn btn-primary btn-block mb-4" id="btn-save-meal">
                    <i class="fa-solid fa-plus"></i> Registrar Refeição
                </button>
                
                <h4 class="mt-4 mb-3" style="font-family: var(--font-display);">Meu Diário</h4>
                <div id="meals-list" style="display:flex; flex-direction:column; gap:0.5rem;">
                </div>
            `;

            this.bindEvents();
            this.renderMeals();
        },

        bindEvents() {
            const btnSave = document.getElementById('btn-save-meal');
            btnSave.addEventListener('click', () => {
                const desc = document.getElementById('meal-desc').value.trim();
                const cals = parseInt(document.getElementById('meal-cals').value) || 0;
                const pro = parseInt(document.getElementById('meal-pro').value) || 0;
                const carb = parseInt(document.getElementById('meal-carb').value) || 0;
                const fat = parseInt(document.getElementById('meal-fat').value) || 0;

                if (!desc) {
                    alert("Por favor, descreva a refeição para salvá-la no diário.");
                    return;
                }

                this.state.meals.push({ desc, cals, pro, carb, fat });
                this.state.consumedCals += cals;
                this.state.consumedPro += pro;
                this.state.consumedCarb += carb;
                this.state.consumedFat += fat;

                // Clear inputs
                document.getElementById('meal-desc').value = '';
                document.getElementById('meal-cals').value = '';
                document.getElementById('meal-pro').value = '';
                document.getElementById('meal-carb').value = '';
                document.getElementById('meal-fat').value = '';

                this.renderMeals();
            });
        },

        renderMeals() {
            const list = document.getElementById('meals-list');

            if (this.state.meals.length === 0) {
                list.innerHTML = `<p style="color:var(--text-muted); font-size:0.8rem; text-align:center; padding: 2rem 0;">Ainda não há alimentação registrada. Cuidado com o catabolismo!</p>`;
                return;
            }

            list.innerHTML = this.state.meals.map(m => `
                <div style="background:var(--bg-dark); padding:1rem; border-radius:12px; border:1px solid var(--glass-border);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.8rem;">
                        <strong>${m.desc}</strong>
                        <span style="color:var(--primary); font-weight:bold;">${m.cals} kcal</span>
                    </div>
                    <div style="display:flex; gap:1.2rem; font-size:0.8rem; color:var(--text-muted);">
                        <span><i class="fa-solid fa-circle" style="color:var(--macro-pro); font-size:0.5rem; vertical-align:middle; margin-right: 4px;"></i> P: ${m.pro}g</span>
                        <span><i class="fa-solid fa-circle" style="color:var(--macro-carb); font-size:0.5rem; vertical-align:middle; margin-right: 4px;"></i> C: ${m.carb}g</span>
                        <span><i class="fa-solid fa-circle" style="color:var(--macro-fat); font-size:0.5rem; vertical-align:middle; margin-right: 4px;"></i> G: ${m.fat}g</span>
                    </div>
                </div>
            `).reverse().join(''); // Reverse to show latest on top
        }
    };

    window.NutritionModule = NutritionModule;

})();
