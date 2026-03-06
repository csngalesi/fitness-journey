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

        async render() {
            const container = document.getElementById('cardio-content-area');
            container.innerHTML = `<p style="text-align:center; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Sincronizando Cardiômetro...</p>`;

            try {
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                if (user) {
                    const { data: logs, error } = await window.supabaseClient
                        .from('mitochondrial_cardio')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('log_date', { ascending: false });

                    if (logs) {
                        this.state.sessions = logs.map(log => ({
                            id: log.id,
                            date: log.log_date,
                            type: log.modality_type,
                            modality: log.modality_name || (log.modality_type === 'HIIT' ? 'Alta Intensidade' : 'Baixa Intensidade'),
                            duration: log.duration_min,
                            description: log.modality_type === 'LISS' ? 'Steady State' : 'Intervalado',
                            cals: log.calories
                        }));

                        this.state.currentWeekly = this.state.sessions.reduce((sum, s) => sum + s.duration, 0);
                    }
                }
            } catch (err) {
                console.warn("Could not fetch cardio logs:", err);
            }

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

                <!-- Action Form Log -->
                <div id="cardio-form-container" style="background: var(--bg-card); padding: 1rem; border-radius: 12px; border: 1px dashed var(--glass-border); margin-bottom: 2rem;">
                    <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <input type="date" id="cardio-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" style="flex: 1;">
                        <select id="cardio-type" class="form-control" style="flex: 1;">
                            <option value="LISS">LISS (Caminhada)</option>
                            <option value="MISS">MISS (Corrida)</option>
                            <option value="HIIT">HIIT (Tiros)</option>
                        </select>
                        <input type="number" id="cardio-duration" class="form-control" placeholder="Min" style="width: 70px;">
                    </div>
                    <button class="btn btn-primary" id="btn-save-cardio" style="width: 100%; padding: 0.8rem; background: linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%); border: none;">
                        <i class="fa-solid fa-fire-flame-curved"></i> Registrar Sessão
                    </button>
                    <div id="cardio-loading" style="display:none; text-align:center; color: var(--primary-light); font-size: 0.8rem; margin-top: 0.5rem;">
                        <i class="fa-solid fa-spinner fa-spin"></i> Registrando no servidor...
                    </div>
                </div>

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
            const btnSave = document.getElementById('btn-save-cardio');
            if (btnSave) {
                btnSave.addEventListener('click', async () => {
                    const duration = parseInt(document.getElementById('cardio-duration').value);
                    const type = document.getElementById('cardio-type').value;
                    const date = document.getElementById('cardio-date').value;

                    if (!duration || duration <= 0) {
                        alert("Por favor, preencha a duração em minutos.");
                        return;
                    }

                    btnSave.disabled = true;
                    document.getElementById('cardio-loading').style.display = 'block';

                    try {
                        const { data: { user } } = await window.supabaseClient.auth.getUser();
                        if (!user) throw new Error("Usuário não logado");

                        let calMultiplier = 5;
                        if (type === 'MISS') calMultiplier = 10;
                        if (type === 'HIIT') calMultiplier = 15;
                        const calories = duration * calMultiplier;

                        const logObj = {
                            user_id: user.id,
                            log_date: date,
                            modality_type: type,
                            modality_name: type === 'HIIT' ? 'Sprints' : 'Esteira/Rua',
                            duration_min: duration,
                            calories: calories
                        };

                        const { error } = await window.supabaseClient
                            .from('mitochondrial_cardio')
                            .insert([logObj]);

                        if (error) throw error;

                        this.render(); // Re-render everything to update progress bar and history
                    } catch (err) {
                        alert("Erro ao salvar cardio: " + err.message);
                        btnSave.disabled = false;
                        document.getElementById('cardio-loading').style.display = 'none';
                    }
                });
            }
        }
    };

    window.CardioModule = CardioModule;

})();
