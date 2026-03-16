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
            meals: [],
            editingId: null
        },

        async render() {
            const container = document.getElementById('nutrition-content-area');
            container.innerHTML = `<p style="text-align:center; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Carregando diário...</p>`;

            this.state.editingId = null;

            try {
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                if (user) {
                    const { data: logs } = await window.supabaseClient
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
                            fullDesc: (log.meals_json && log.meals_json[0]) ? (log.meals_json[0].fullDesc || log.meals_json[0].desc || '') : '',
                            isFullDay: (log.meals_json && log.meals_json[0]) ? log.meals_json[0].isFullDay : false,
                            items: (log.meals_json && log.meals_json[0] && log.meals_json[0].items) ? log.meals_json[0].items : [],
                            cals: log.total_calories || 0,
                            pro: log.macros_json?.pro || 0,
                            carb: log.macros_json?.carb || 0,
                            fat: log.macros_json?.fat || 0
                        }));
                    }
                }
            } catch (err) {
                console.warn("Could not fetch nutrition logs:", err);
            }

            container.innerHTML = `
                <!-- Form panel (hidden by default, shown on + button) -->
                <div id="nutrition-form" style="display:none; margin-bottom:1.5rem; padding-bottom:1.5rem; border-bottom:1px solid var(--glass-border);">
                    <div class="form-group mb-2">
                        <input type="text" id="log-title" class="form-control" placeholder='Ex: "Baseline Pré-Cutting" ou "Avião p/ Praia"'>
                    </div>
                    <div class="form-group mb-3">
                        <input type="date" id="log-date" class="form-control" style="color: var(--text-muted);" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group mt-3">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                            <label style="font-size:0.85rem; color:var(--text-muted); margin:0;">O que você comeu?</label>
                            <label style="font-size:0.8rem; display:flex; align-items:center; gap:0.3rem;">
                                <input type="checkbox" id="is-full-day" checked style="accent-color:var(--primary);">
                                Dia Inteiro
                            </label>
                        </div>
                        <textarea id="meal-desc" class="form-control" rows="3" placeholder='Ex: "Comi 3 ovos mexidos com 2 fatias de pão integral..."'></textarea>
                    </div>
                    <div style="display:flex; gap:0.5rem; margin-top:1rem;">
                        <button class="btn btn-primary" style="flex:1;" id="btn-save-meal">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> Calcular Macros
                        </button>
                        <button class="btn-icon" style="width:50px; flex-shrink:0;" title="Enviar Foto" onclick="alert('Feature placeholder: Abrir câmera para Visão Computacional')">
                            <i class="fa-solid fa-camera"></i>
                        </button>
                        <button class="btn-icon" style="width:50px; flex-shrink:0;" title="Ditar Refeição" onclick="alert('Feature placeholder: Iniciar gravação de voz')">
                            <i class="fa-solid fa-microphone"></i>
                        </button>
                    </div>
                    <div id="ai-loading" style="display:none; text-align:center; margin-top:1rem; color:var(--primary-light);">
                        <i class="fa-solid fa-robot fa-bounce"></i> Analisando e Salvando...
                    </div>
                </div>

                <!-- Meals list grouped by date -->
                <div id="meals-list"></div>
            `;

            this.bindEvents();
            this.renderMeals();
        },

        bindEvents() {
            // Toggle form via + button in header
            document.getElementById('btn-add-meal')?.addEventListener('click', () => {
                const form = document.getElementById('nutrition-form');
                if (!form) return;
                const isOpen = form.style.display !== 'none';
                if (isOpen) {
                    form.style.display = 'none';
                    this._resetForm();
                } else {
                    this.state.editingId = null;
                    this._resetForm();
                    form.style.display = 'block';
                    document.getElementById('meal-desc')?.focus();
                }
            });

            const btnSave = document.getElementById('btn-save-meal');
            if (!btnSave) return;
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

                    const macroResp = await fetch('/api/extract-macros', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ description: desc })
                    });
                    const macroData = await macroResp.json();
                    if (!macroResp.ok) throw new Error(macroData.error || 'Erro na análise de macros pela IA');

                    const { cals, pro, carb, fat, items = [] } = macroData;
                    const isFullDay = document.getElementById('is-full-day').checked;
                    const displayDesc = desc.substring(0, 100) + (desc.length > 100 ? '...' : '');

                    const { error: profileErr } = await window.supabaseClient
                        .from('profiles')
                        .insert({ id: user.id, first_name: user.email?.split('@')[0] || 'user' });
                    if (profileErr && profileErr.code !== '23505') {
                        throw new Error('Erro ao criar perfil base: ' + profileErr.message);
                    }

                    const logObj = {
                        log_date: date,
                        title,
                        total_calories: cals,
                        macros_json: { pro, carb, fat },
                        meals_json: [{ isFullDay, desc: displayDesc, fullDesc: desc, items }]
                    };

                    if (this.state.editingId) {
                        // UPDATE existing record
                        const { error } = await window.supabaseClient
                            .from('nutrition_logs')
                            .update(logObj)
                            .eq('id', this.state.editingId);
                        if (error) throw error;

                        const idx = this.state.meals.findIndex(m => m.id === this.state.editingId);
                        if (idx >= 0) {
                            this.state.meals[idx] = { id: this.state.editingId, title, date, desc: displayDesc, fullDesc: desc, isFullDay, items, cals, pro, carb, fat };
                        }
                        this.state.editingId = null;
                    } else {
                        // INSERT new record
                        const { data, error } = await window.supabaseClient
                            .from('nutrition_logs')
                            .insert([{ user_id: user.id, ...logObj }])
                            .select()
                            .single();
                        if (error) throw error;

                        this.state.meals.unshift({ id: data.id, title, date, desc: displayDesc, fullDesc: desc, isFullDay, items, cals, pro, carb, fat });
                    }

                    document.getElementById('nutrition-form').style.display = 'none';
                    this._resetForm();
                    this.renderMeals();
                } catch (err) {
                    alert("Erro ao salvar refeição: " + err.message);
                } finally {
                    btnSave.disabled = false;
                    document.getElementById('ai-loading').style.display = 'none';
                }
            });
        },

        startEdit(id) {
            const meal = this.state.meals.find(m => m.id === id);
            if (!meal) return;
            this.state.editingId = id;

            const form = document.getElementById('nutrition-form');
            form.style.display = 'block';
            document.getElementById('log-title').value = meal.title || '';
            document.getElementById('log-date').value = meal.date || '';
            document.getElementById('meal-desc').value = meal.fullDesc || meal.desc || '';
            document.getElementById('is-full-day').checked = meal.isFullDay || false;

            const btn = document.getElementById('btn-save-meal');
            if (btn) btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Alterações';

            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },

        _resetForm() {
            const titleEl = document.getElementById('log-title');
            const descEl  = document.getElementById('meal-desc');
            const dateEl  = document.getElementById('log-date');
            const fdEl    = document.getElementById('is-full-day');
            const btn     = document.getElementById('btn-save-meal');
            if (titleEl) titleEl.value = '';
            if (descEl)  descEl.value  = '';
            if (dateEl)  dateEl.value  = new Date().toISOString().split('T')[0];
            if (fdEl)    fdEl.checked  = true;
            if (btn)     btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Calcular Macros';
        },

        renderMeals() {
            const list = document.getElementById('meals-list');
            if (!list) return;

            if (this.state.meals.length === 0) {
                list.innerHTML = `<p style="color:var(--text-muted); font-size:0.8rem; text-align:center; padding:2rem 0;">Ainda não há alimentação registrada. Cuidado com o catabolismo!</p>`;
                return;
            }

            // Group by date, sorted desc
            const byDate = {};
            this.state.meals.forEach(m => {
                if (!byDate[m.date]) byDate[m.date] = [];
                byDate[m.date].push(m);
            });
            const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

            list.innerHTML = dates.map(date => {
                const dayMeals = byDate[date];
                const partials = dayMeals.filter(m => !m.isFullDay);
                const showSum  = partials.length >= 1;
                const sum      = showSum ? {
                    cals: partials.reduce((s, m) => s + m.cals, 0),
                    pro:  partials.reduce((s, m) => s + m.pro,  0),
                    carb: partials.reduce((s, m) => s + m.carb, 0),
                    fat:  partials.reduce((s, m) => s + m.fat,  0),
                } : null;

                const d = new Date(date + 'T12:00:00');
                const dateLabel = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

                return `
                    <div style="margin-bottom:1.8rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; padding:0 2px;">
                            <span style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.06em; font-weight:600;">${dateLabel}</span>
                            ${sum ? `<span style="font-size:0.72rem; color:var(--primary-light); font-weight:600;">${sum.cals} kcal &nbsp;·&nbsp; P ${sum.pro}g &nbsp;C ${sum.carb}g &nbsp;G ${sum.fat}g</span>` : ''}
                        </div>
                        ${dayMeals.map(m => this._mealCardHtml(m)).join('')}
                    </div>
                `;
            }).join('');
        },

        _mealCardHtml(m) {
            const itemsHtml = m.items && m.items.length ? `
                <div style="margin:0.6rem 0 0.4rem; border-top:1px solid var(--glass-border); padding-top:0.5rem;">
                    ${m.items.map(it => `
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; padding:2px 0; color:var(--text-muted);">
                            <span>${it.name}</span>
                            <span style="color:var(--primary-light); white-space:nowrap; margin-left:0.5rem;">${it.cals} kcal &middot; P${it.pro} C${it.carb} G${it.fat}</span>
                        </div>
                    `).join('')}
                </div>` : '';

            return `
                <div style="background:var(--bg-dark); padding:1rem; border-radius:12px; border:1px solid var(--glass-border); margin-bottom:0.5rem;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.3rem;">
                        <strong style="color:var(--text-main); flex:1;">${m.title}</strong>
                        <div style="display:flex; align-items:center; gap:0.4rem; flex-shrink:0; margin-left:0.5rem;">
                            <span style="color:var(--primary); font-weight:bold;">${m.cals} kcal</span>
                            <button onclick="window.NutritionModule.startEdit('${m.id}')" style="background:none;border:none;cursor:pointer;padding:3px 6px;color:var(--text-muted);font-size:0.8rem;line-height:1;" title="Editar">
                                <i class="fa-solid fa-pencil"></i>
                            </button>
                        </div>
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.5rem; display:flex; gap:0.5rem;">
                        ${m.isFullDay
                            ? '<span style="color:var(--primary-light);"><i class="fa-solid fa-clock" style="margin-right:3px;"></i>Dia Inteiro</span>'
                            : '<span><i class="fa-solid fa-utensils" style="margin-right:3px;"></i>Refeição</span>'}
                    </div>
                    <div style="margin-bottom:0.5rem; font-size:0.82rem; font-style:italic; color:var(--text-muted);">"${m.desc}"</div>
                    ${itemsHtml}
                    <div style="display:flex; gap:1.2rem; font-size:0.8rem; color:#a1a1aa; margin-top:0.4rem;">
                        <span><i class="fa-solid fa-circle" style="color:var(--macro-pro); font-size:0.5rem; vertical-align:middle; margin-right:4px;"></i> P: ${m.pro}g</span>
                        <span><i class="fa-solid fa-circle" style="color:var(--macro-carb); font-size:0.5rem; vertical-align:middle; margin-right:4px;"></i> C: ${m.carb}g</span>
                        <span><i class="fa-solid fa-circle" style="color:var(--macro-fat); font-size:0.5rem; vertical-align:middle; margin-right:4px;"></i> G: ${m.fat}g</span>
                    </div>
                </div>
            `;
        }
    };

    window.NutritionModule = NutritionModule;

})();
