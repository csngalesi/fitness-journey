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

        async render() {
            const container = document.getElementById('nutrition-content-area');
            container.innerHTML = `<p style="text-align:center; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Carregando diário...</p>`;

            try {
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                if (user) {
                    const { data: logs, error } = await window.supabaseClient
                        .from('nutrition_logs')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false });

                    if (logs) {
                        this.state.meals = logs.map(log => ({
                            id: log.id,
                            title: log.title,
                            date: log.log_date,
                            desc: (log.meals_json && log.meals_json[0]) ? log.meals_json[0].desc : '',
                            isFullDay: (log.meals_json && log.meals_json[0]) ? log.meals_json[0].isFullDay : false,
                            cals: log.total_calories || 0,
                            pro: log.macros_json?.pro || 0,
                            carb: log.macros_json?.carb || 0,
                            fat: log.macros_json?.fat || 0
                        }));

                        this.state.consumedCals = this.state.meals.reduce((sum, m) => sum + m.cals, 0);
                        this.state.consumedPro = this.state.meals.reduce((sum, m) => sum + m.pro, 0);
                        this.state.consumedCarb = this.state.meals.reduce((sum, m) => sum + m.carb, 0);
                        this.state.consumedFat = this.state.meals.reduce((sum, m) => sum + m.fat, 0);
                    }
                }
            } catch (err) {
                console.warn("Could not fetch nutrition logs:", err);
            }

            // Render basic layout
            container.innerHTML = `
                <div class="macro-summary mb-3" style="font-size: 0.9rem;">
                    <strong>Metas de Referência (Acompanhamento Pontual)</strong><br>
                    <span style="color:var(--text-muted)">Cals: ${this.state.targetCals} | P: ${this.state.targetPro}g | C: ${this.state.targetCarb}g | F: ${this.state.targetFat}g</span>
                </div>

                <div class="form-group mt-4 mb-2">
                    <input type="text" id="log-title" class="form-control" placeholder='Ex: "Baseline Pré-Cutting" ou "Avião p/ Praia"'>
                </div>
                
                <div class="form-group mb-3">
                    <input type="date" id="log-date" class="form-control" style="color: var(--text-muted);" value="${new Date().toISOString().split('T')[0]}">
                </div>
                
                <div class="form-group mt-3">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <label style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">O que você comeu?</label>
                        <label style="font-size: 0.8rem; display: flex; align-items: center; gap: 0.3rem;">
                            <input type="checkbox" id="is-full-day" checked style="accent-color: var(--primary);">
                            Registro do Dia Inteiro
                        </label>
                    </div>
                    <textarea id="meal-desc" class="form-control" rows="3" placeholder='Ex: "Comi 3 ovos mexidos com 2 fatias de pão integral e 1 fatia de queijo prato..."'></textarea>
                </div>
                
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
                    <button class="btn btn-primary" style="flex: 1;" id="btn-save-meal">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Calcular Macros
                    </button>
                    <button class="btn-icon" style="width: 50px; flex-shrink: 0;" title="Enviar Foto" onclick="alert('Feature placeholder: Abrir câmera para Visão Computacional')">
                        <i class="fa-solid fa-camera"></i>
                    </button>
                    <button class="btn-icon" style="width: 50px; flex-shrink: 0;" title="Ditar Refeição" onclick="alert('Feature placeholder: Iniciar gravação de voz')">
                        <i class="fa-solid fa-microphone"></i>
                    </button>
                </div>
                
                <div id="ai-loading" style="display:none; text-align:center; margin-bottom:1.5rem; color: var(--primary-light);">
                    <i class="fa-solid fa-robot fa-bounce"></i> Analisando e Salvando...
                </div>
                
                <h4 class="mt-4 mb-3" style="font-family: var(--font-display);">Meu Diário</h4>
                <div id="meals-list" style="display:flex; flex-direction:column; gap:0.5rem;">
                </div>
            `;

            this.bindEvents();
            this.renderMeals();
        },

        bindEvents() {
            const btnSave = document.getElementById('btn-save-meal');
            btnSave.addEventListener('click', async () => {
                const title = document.getElementById('log-title').value.trim() || 'Sem Título (Registro Genérico)';
                const date = document.getElementById('log-date').value;
                const desc = document.getElementById('meal-desc').value.trim();

                if (!desc) {
                    alert("Descreva o que você comeu ou use a foto/áudio.");
                    return;
                }

                btnSave.disabled = true;
                document.getElementById('ai-loading').style.display = 'block';

                try {
                    const { data: { user } } = await window.supabaseClient.auth.getUser();
                    if (!user) throw new Error("Usuário não logado");

                    // Real AI macro extraction via Gemini
                    const macroResp = await fetch('/api/extract-macros', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ description: desc })
                    });
                    const macroData = await macroResp.json();
                    if (!macroResp.ok) throw new Error(macroData.error || 'Erro na análise de macros pela IA');
                    const { cals, pro, carb, fat } = macroData;
                    const isFullDay = document.getElementById('is-full-day').checked;
                    let displayDesc = desc.substring(0, 100) + (desc.length > 100 ? '...' : '');

                    // Ensure profile row exists (nutrition_logs FK references profiles.id)
                    const { error: profileErr } = await window.supabaseClient
                        .from('profiles')
                        .upsert(
                            { id: user.id, first_name: user.email?.split('@')[0] || 'User' },
                            { onConflict: 'id', ignoreDuplicates: true }
                        );
                    if (profileErr) throw new Error('Erro ao criar perfil base: ' + profileErr.message);

                    // Format intended payload for Supabase insertion
                    const logObj = {
                        user_id: user.id,
                        log_date: date,
                        title: title,
                        total_calories: cals,
                        macros_json: { pro, carb, fat },
                        meals_json: [{ isFullDay, desc: displayDesc }]
                    };

                    const { data, error } = await window.supabaseClient
                        .from('nutrition_logs')
                        .insert([logObj])
                        .select()
                        .single();

                    if (error) throw error;

                    // Update local state dynamically without full reload
                    this.state.meals.unshift({
                        id: data.id,
                        title,
                        date,
                        desc: displayDesc,
                        cals, pro, carb, fat, isFullDay
                    });
                    this.state.consumedCals += cals;
                    this.state.consumedPro += pro;
                    this.state.consumedCarb += carb;
                    this.state.consumedFat += fat;

                    document.getElementById('log-title').value = '';
                    document.getElementById('meal-desc').value = '';
                    this.renderMeals();
                } catch (err) {
                    alert("Erro ao salvar refeição: " + err.message);
                } finally {
                    btnSave.disabled = false;
                    document.getElementById('ai-loading').style.display = 'none';
                }
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
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.3rem;">
                        <strong style="color:var(--text-main);">${m.title}</strong>
                        <span style="color:var(--primary); font-weight:bold;">${m.cals} kcal</span>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.8rem; display: flex; gap: 0.5rem;">
                        <span><i class="fa-regular fa-calendar" style="margin-right:3px;"></i>${m.date}</span>
                        ${m.isFullDay ? '<span style="color:var(--primary-light);"><i class="fa-solid fa-clock" style="margin-right:3px;"></i>Dia Inteiro</span>' : ''}
                    </div>
                    <div style="margin-bottom: 0.8rem; font-size: 0.85rem; font-style: italic; color: var(--text-muted);">
                        "${m.desc}"
                    </div>
                    <div style="display:flex; gap:1.2rem; font-size:0.8rem; color: #a1a1aa;">
                        <span><i class="fa-solid fa-circle" style="color:var(--macro-pro); font-size:0.5rem; vertical-align:middle; margin-right: 4px;"></i> P: ${m.pro}g</span>
                        <span><i class="fa-solid fa-circle" style="color:var(--macro-carb); font-size:0.5rem; vertical-align:middle; margin-right: 4px;"></i> C: ${m.carb}g</span>
                        <span><i class="fa-solid fa-circle" style="color:var(--macro-fat); font-size:0.5rem; vertical-align:middle; margin-right: 4px;"></i> G: ${m.fat}g</span>
                    </div>
                </div>
            `).join(''); // No need to reverse since we ordered by created_at desc from Supabase and use unshift
        }
    };

    window.NutritionModule = NutritionModule;

})();
