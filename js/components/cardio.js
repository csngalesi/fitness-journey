/**
 * Fitness Journey MED - Cardio Prescription & Tracking Module
 */

(function () {
    'use strict';

    const CardioModule = {
        state: {
            weeklyGoal: 150, // minutes
            currentWeekly: 90,
            sessions: [
                { id: 1, date: 'Hoje', type: 'HIIT', modality: 'Bike Ergométrica', duration: 20, description: '1 min Forte / 1 min Fraco', cals: 210 },
                { id: 2, date: 'Ontem', type: 'LISS', modality: 'Caminhada Rápida', duration: 45, description: 'Esteira Inclinação 6', cals: 320 },
                { id: 3, date: 'Segunda', type: 'MISS', modality: 'Corrida Contínua', duration: 25, description: 'Rua', cals: 260 }
            ]
        },

        render() {
            const container = document.getElementById('cardio-content-area');
            const progressPct = Math.min((this.state.currentWeekly / this.state.weeklyGoal) * 100, 100).toFixed(0);

            container.innerHTML = `
                <!-- Weekly Meta Status -->
                <div style="background: var(--bg-dark); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--glass-border); margin-bottom: 2rem; position: relative; overflow: hidden;">
                    <span style="position: absolute; top:0; right: 0; padding: 0.3rem 0.8rem; background: var(--primary); color: #fff; font-size: 0.7rem; font-weight: bold; border-bottom-left-radius: 12px;">Saúde Mitocondrial</span>
                    <h5 style="color: var(--primary); margin-bottom: 0.2rem;"><i class="fa-solid fa-heart-pulse"></i> Missão Semanal</h5>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.2rem;">Meta de oxigenação baseada nas diretrizes clínicas de saúde cardiovascular (AHA).</p>
                    
                    <!-- Progress Bar -->
                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem;">
                        <span style="font-size: 1.8rem; font-weight: bold; color: var(--text-main); font-family: var(--font-display);">${this.state.currentWeekly}<span style="font-size: 1rem; color: var(--text-muted);">min</span></span>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">Alvo: ${this.state.weeklyGoal} min</span>
                    </div>
                    
                    <div style="width: 100%; background: rgba(255,255,255,0.05); height: 12px; border-radius: 6px; overflow: hidden; position: relative;">
                        <div style="width: ${progressPct}%; background: linear-gradient(90deg, #ff416c 0%, #ff4b2b 100%); height: 100%; border-radius: 6px; box-shadow: 0 0 10px rgba(255, 65, 108, 0.5);"></div>
                    </div>
                    <div style="text-align: right; margin-top: 0.3rem; font-size: 0.75rem; color: ${progressPct >= 100 ? '#28a745' : 'var(--text-muted)'}; font-weight: bold;">
                        ${progressPct}% Concluído
                    </div>
                </div>

                <!-- Action Button Log -->
                <button class="btn btn-primary" id="btn-add-cardio" style="width: 100%; padding: 1rem; margin-bottom: 2rem; background: linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%); border: none;">
                    <i class="fa-solid fa-fire-flame-curved"></i> Inserir Sessão de Cardio
                </button>

                <!-- History Log -->
                <h4 class="mb-3" style="font-family: var(--font-display);">Histórico da Semana</h4>
                <div id="cardio-history-list" style="display:flex; flex-direction:column; gap:0.8rem;">
                    ${this.renderHistory()}
                </div>
            `;

            this.bindEvents();
        },

        renderHistory() {
            if (this.state.sessions.length === 0) {
                return `<div style="text-align: center; color: var(--text-muted); padding: 1rem;">Nenhum cardio logado na semana. Mova-se!</div>`;
            }

            return this.state.sessions.map(s => {
                let badgeColor = 'var(--text-muted)';
                let icon = 'fa-person-walking';
                if (s.type === 'HIIT') { badgeColor = '#ff4b2b'; icon = 'fa-bolt'; }
                if (s.type === 'LISS') { badgeColor = '#4facfe'; icon = 'fa-shoe-prints'; }
                if (s.type === 'MISS') { badgeColor = '#f6d365'; icon = 'fa-person-running'; }

                return `
                <div style="background: var(--bg-dark); border-radius: 12px; border-left: 4px solid ${badgeColor}; padding: 1rem; display: flex; align-items: center; justify-content: space-between;">
                    
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <div style="width: 45px; height: 45px; border-radius: 50%; background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; color: ${badgeColor}; font-size: 1.2rem;">
                            <i class="fa-solid ${icon}"></i>
                        </div>
                        <div>
                            <strong style="color: var(--text-main); font-size: 1rem; display: block;">${s.modality}</strong>
                            <span style="font-size: 0.75rem; color: var(--text-muted);"><i class="fa-regular fa-clock" style="margin-right:2px;"></i> ${s.date} • ${s.description}</span>
                        </div>
                    </div>
                    
                    <div style="text-align: right;">
                        <span style="display: block; font-weight: bold; color: ${badgeColor}; font-size: 1.1rem;">${s.duration} <span style="font-size:0.7rem;">min</span></span>
                        <span style="font-size: 0.7rem; color: var(--text-muted);"><i class="fa-solid fa-fire" style="color: #ff9a9e;"></i> ${s.cals} kcal</span>
                    </div>

                </div>
                `;
            }).join('');
        },

        bindEvents() {
            const btnAdd = document.getElementById('btn-add-cardio');
            if (btnAdd) {
                btnAdd.addEventListener('click', () => {
                    alert('Nesta tela você registrará o LISS (esteira com inclinação), HIIT (tiros na bike) ou MISS (corrida contínua), e os minutos subirão para barra da meta semanal. Vamos prototipar a inclusão na integração de backend!');
                });
            }
        }
    };

    window.CardioModule = CardioModule;

})();
