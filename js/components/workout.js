/**
 * Fitness Journey MED - Workout & Physique Architect Module
 */

(function () {
    'use strict';

    const WorkoutModule = {
        state: {
            activeTab: 'architect', // 'architect' | 'weekly' | 'report'
            targetPhysique: 'Frank Zane (V-Shape Clássico)',
            simulatedVolumes: null, // Store new volumes simulation
            aiRationale: null,      // Justificativa da IA sobre o plano de volumes
            weeklySplit: null,      // Split semanal com exercícios por dia
            reportingDay: null      // Dia selecionado para relato { day, label, groups }
        },

        async render() {
            const container = document.getElementById('workout-content-area');
            container.innerHTML = `<p style="text-align:center; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Carregando suas prescrições no banco de dados...</p>`;

            try {
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                if (user) {
                    // Fetch Architect Config
                    const { data: archData } = await window.supabaseClient
                        .from('physique_architect')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('updated_at', { ascending: false })
                        .limit(1)
                        .single();

                    if (archData) {
                        if (archData.master_prompt) this.state.targetPhysique = archData.master_prompt;
                        const wv = archData.weekly_volumes_json;
                        if (wv) {
                            // New format: { volumes, rationale } | Old format: array
                            if (Array.isArray(wv) && wv.length > 0) {
                                this.state.simulatedVolumes = wv;
                            } else if (wv.volumes && wv.volumes.length > 0) {
                                this.state.simulatedVolumes = wv.volumes;
                                this.state.aiRationale = wv.rationale || null;
                                this.state.weeklySplit  = wv.weekly_split || null;
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn("Could not fetch workout config:", err);
            }

            const tabStyle = (tab) => `flex:1; text-align:center; padding: 0.7rem 0.3rem; cursor:pointer; font-weight: bold; font-size: 0.8rem;
                color: ${this.state.activeTab === tab ? 'var(--primary)' : 'var(--text-muted)'};
                border-bottom: ${this.state.activeTab === tab ? '2px solid var(--primary)' : 'none'}; margin-bottom: -2px;`;

            container.innerHTML = `
                <!-- Tabs Navigation -->
                <div style="display:flex; border-bottom: 2px solid var(--glass-border); margin-bottom: 1.5rem;">
                    <div class="workout-tab" data-tab="architect" style="${tabStyle('architect')}">
                        <i class="fa-solid fa-compass-drafting"></i> O Arquiteto
                    </div>
                    <div class="workout-tab" data-tab="weekly" style="${tabStyle('weekly')}">
                        <i class="fa-solid fa-calendar-week"></i> Semana
                    </div>
                    <div class="workout-tab" data-tab="report" style="${tabStyle('report')}">
                        <i class="fa-solid fa-clipboard-list"></i> Relatório
                    </div>
                </div>

                <!-- Tab Contents -->
                <div id="tab-architect" style="display: ${this.state.activeTab === 'architect' ? 'block' : 'none'};">
                    ${this.renderArchitectTab()}
                </div>

                <div id="tab-weekly" style="display: ${this.state.activeTab === 'weekly' ? 'block' : 'none'};">
                    ${this.renderWeeklyTab()}
                </div>

                <div id="tab-report" style="display: ${this.state.activeTab === 'report' ? 'block' : 'none'};">
                    ${this.renderReportTab()}
                </div>
            `;

            this.bindEvents();
        },

        renderArchitectTab() {
            return `
                <div style="background: var(--bg-dark); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--primary-light); margin-bottom: 1.5rem;">
                    <h5 style="color: var(--primary); margin-bottom: 0.5rem;"><i class="fa-solid fa-bullseye"></i> Estética Alvo (Prompt)</h5>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
                        A Inteligência Artificial ajustará o seu Volume Semanal (número de séries) para esculpir as proporções abaixo, realocando esforço dos grupos fortes para as deficiências.
                    </p>
                    <textarea id="physique-prompt" class="form-control" rows="4" style="background: var(--bg-card); font-family: 'Courier New', Courier, monospace; font-size: 0.85rem; border: 1px dashed var(--glass-border);">${this.state.targetPhysique}</textarea>
                    
                    <button class="btn btn-primary mt-3" id="btn-recalc-volumes" style="width: 100%;">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Recalcular Volumes (Ajuste Mensal)
                    </button>
                    <div id="recalc-loading" style="display:none; text-align:center; color: var(--primary-light); font-size: 0.85rem; margin-top: 1rem;">
                        <i class="fa-solid fa-robot fa-bounce"></i> IA escaneando biometria e recalculando as proporções...
                    </div>
                </div>

                <div id="volumes-dashboard">
                    ${this.renderTargetVolumes()}
                </div>
            `;
        },

        renderTargetVolumes() {
            // Default View
            if (!this.state.simulatedVolumes) {
                return `
                    <h5 class="mb-3" style="font-family: var(--font-display);">Distribuição Alvo (Semanas 1-4)</h5>
                    <div style="display: flex; flex-direction: column; gap: 0.8rem;">
                        <div style="background: var(--bg-dark); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--primary);">
                            <div style="display:flex; justify-content: space-between; align-items:center;">
                                <strong style="color: var(--text-main);">Ombros (Foco Lateral)</strong>
                                <span style="background: var(--primary); color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;">Alto Vol: 22 Séries</span>
                            </div>
                        </div>
                        <div style="background: var(--bg-dark); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--primary);">
                            <div style="display:flex; justify-content: space-between; align-items:center;">
                                <strong style="color: var(--text-main);">Dorsal (Remadas/Puxadas)</strong>
                                <span style="background: var(--primary); color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;">Alto Vol: 18 Séries</span>
                            </div>
                        </div>
                        <div style="background: var(--bg-dark); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--macro-pro);">
                            <div style="display:flex; justify-content: space-between; align-items:center;">
                                <strong style="color: var(--text-main);">Peitoral (Inclinados)</strong>
                                <span style="background: var(--macro-pro); color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;">Vol Médio: 14 Séries</span>
                            </div>
                        </div>
                        <div style="background: var(--bg-dark); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--text-muted);">
                            <div style="display:flex; justify-content: space-between; align-items:center;">
                                <strong style="color: var(--text-main);">Pernas (Quadríceps/Posterior)</strong>
                                <span style="color: var(--text-muted); padding: 2px 8px; font-size: 0.75rem; font-weight: bold; border: 1px solid var(--glass-border); border-radius: 12px;">Manutenção: 10 Séries</span>
                            </div>
                        </div>
                    </div>
                `;
            }

            // Simulated View
            return `
                <h5 class="mb-3" style="font-family: var(--font-display);">Ajuste de Inteligência Artificial <i class="fa-solid fa-check-circle" style="color: #28a745; font-size:0.8rem;"></i></h5>
                ${this.state.aiRationale ? `<p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">${this.state.aiRationale}</p>` : ''}
                <div style="display: flex; flex-direction: column; gap: 0.8rem;">
                    ${this.state.simulatedVolumes.map(vol => `
                        <div style="background: var(--bg-dark); padding: 1rem; border-radius: 8px; border-left: 4px solid ${vol.color};">
                            <div style="display:flex; justify-content: space-between; align-items:center;">
                                <strong style="color: var(--text-main);">${vol.muscle}</strong>
                                <span style="${vol.pillStyle}">${vol.label}: ${vol.sets} Séries</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        },

        _distributeSets(totalSets, count) {
            if (!count) return [];
            const base = Math.floor(totalSets / count);
            const extra = totalSets % count;
            return Array.from({ length: count }, (_, i) => base + (i < extra ? 1 : 0));
        },

        renderWeeklyTab() {
            if (!this.state.weeklySplit || this.state.weeklySplit.length === 0) {
                return `
                    <div style="text-align:center; padding: 2rem; color: var(--text-muted);">
                        <i class="fa-solid fa-calendar-week" style="font-size: 2rem; margin-bottom: 1rem; display:block; opacity:0.4;"></i>
                        <p>Nenhum split gerado ainda.</p>
                        <p style="font-size: 0.85rem;">Acesse <strong>O Arquiteto</strong> e clique em <em>Recalcular Volumes</em> para a IA prescrever sua semana de treinos.</p>
                    </div>
                `;
            }

            return `
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    ${this.state.weeklySplit.map(day => `
                        <div style="background: var(--bg-dark); border-radius: 12px; border: 1px solid var(--glass-border); overflow: hidden;">
                            <div style="padding: 0.75rem 1rem; background: rgba(var(--primary-rgb, 139,0,0), 0.15); border-bottom: 1px solid var(--glass-border); display:flex; align-items:center; gap: 0.75rem;">
                                <span style="background: var(--primary); color: #fff; font-weight: bold; font-size: 0.8rem; padding: 2px 10px; border-radius: 20px; white-space:nowrap;">${day.day}</span>
                                <strong style="font-size: 0.9rem; color: var(--text-main); flex:1;">${day.label || ''}</strong>
                                <button class="btn-relatar" data-day-index="${this.state.weeklySplit.indexOf(day)}"
                                    style="font-size: 0.72rem; padding: 3px 10px; border-radius: 20px; border: 1px solid var(--primary-light); background: transparent; color: var(--primary-light); cursor: pointer; white-space:nowrap;">
                                    <i class="fa-solid fa-pen-to-square"></i> Relatar
                                </button>
                            </div>
                            <div style="padding: 0.75rem 1rem; display: flex; flex-direction: column; gap: 0.6rem;">
                                ${(day.groups || []).map(g => {
                                    const perEx = this._distributeSets(g.sets, (g.exercises || []).length);
                                    return `
                                    <div>
                                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.35rem;">
                                            <span style="font-weight: bold; font-size: 0.85rem; color: var(--text-main);">${g.muscle}</span>
                                            <span style="font-size: 0.75rem; color: var(--primary-light); font-weight: bold;">${g.sets} séries</span>
                                        </div>
                                        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                                            ${(g.exercises || []).map((ex, i) => `
                                                <div style="display:flex; align-items:center; gap: 0.4rem;">
                                                    <span style="font-size: 0.72rem; color: var(--primary); font-weight: bold; min-width: 28px; text-align:right;">${perEx[i]}×</span>
                                                    <span style="font-size: 0.78rem; color: var(--text-muted); background: var(--bg-card); border: 1px solid var(--glass-border); padding: 3px 10px; border-radius: 20px; flex:1;">${ex}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>`;
                                }).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        },

        renderReportTab() {
            const day = this.state.reportingDay;
            if (!day) {
                return `
                    <div style="text-align:center; padding: 2rem; color: var(--text-muted);">
                        <i class="fa-solid fa-clipboard-list" style="font-size: 2rem; margin-bottom: 1rem; display:block; opacity:0.4;"></i>
                        <p>Nenhum treino selecionado.</p>
                        <p style="font-size: 0.85rem;">Acesse a aba <strong>Semana</strong> e clique em <em>Relatar</em> no dia que você treinou.</p>
                    </div>
                `;
            }

            const allExercises = (day.groups || []).flatMap(g => {
                const perEx = this._distributeSets(g.sets, (g.exercises || []).length);
                return (g.exercises || []).map((ex, i) => ({ name: ex, muscle: g.muscle, sets: perEx[i] }));
            });

            return `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                    <div>
                        <span style="background: var(--primary); color: #fff; font-size: 0.75rem; font-weight: bold; padding: 2px 10px; border-radius: 20px;">${day.day}</span>
                        <strong style="margin-left: 0.5rem; color: var(--text-main);">${day.label || ''}</strong>
                    </div>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${new Date().toLocaleDateString('pt-BR')}</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 0.8rem;" id="report-exercises">
                    ${allExercises.map((ex, i) => `
                        <div style="background: var(--bg-dark); border-radius: 10px; border: 1px solid var(--glass-border); padding: 0.8rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.5rem;">
                                <strong style="font-size: 0.85rem;">${i + 1}. ${ex.name}</strong>
                                <span style="font-size: 0.72rem; color: var(--text-muted);">${ex.muscle}</span>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.4rem;">
                                <div>
                                    <label style="font-size: 0.65rem; color: var(--text-muted); text-transform:uppercase; display:block; margin-bottom:2px;">Séries</label>
                                    <input type="number" class="form-control report-sets" data-ex="${i}" value="${ex.sets}" min="1" style="padding: 0.4rem; text-align:center; font-size:0.85rem;">
                                </div>
                                <div>
                                    <label style="font-size: 0.65rem; color: var(--text-muted); text-transform:uppercase; display:block; margin-bottom:2px;">Peso (kg)</label>
                                    <input type="number" class="form-control report-weight" data-ex="${i}" placeholder="0" step="0.5" style="padding: 0.4rem; text-align:center; font-size:0.85rem;">
                                </div>
                                <div>
                                    <label style="font-size: 0.65rem; color: var(--text-muted); text-transform:uppercase; display:block; margin-bottom:2px;">Reps</label>
                                    <input type="number" class="form-control report-reps" data-ex="${i}" placeholder="0" style="padding: 0.4rem; text-align:center; font-size:0.85rem;">
                                </div>
                            </div>
                            <input type="text" class="form-control report-note mt-2" data-ex="${i}" placeholder="Comentário (opcional)" style="padding: 0.4rem; font-size: 0.8rem; margin-top: 0.4rem;">
                        </div>
                    `).join('')}
                </div>

                <button class="btn btn-primary mt-4" id="btn-save-report" style="width: 100%; padding: 1rem; background: #28a745; border-color: #28a745;">
                    <i class="fa-solid fa-flag-checkered"></i> Salvar Relatório de Treino
                </button>
            `;
        },

        bindEvents() {
            const tabs = document.querySelectorAll('.workout-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    const selectedTab = e.currentTarget.getAttribute('data-tab');
                    if (this.state.activeTab !== selectedTab) {
                        this.state.activeTab = selectedTab;
                        this.render(); // Re-render to update classes and visibility
                    }
                });
            });

            const btnRecalc = document.getElementById('btn-recalc-volumes');
            if (btnRecalc) {
                btnRecalc.addEventListener('click', async () => {
                    const loading = document.getElementById('recalc-loading');
                    const dash = document.getElementById('volumes-dashboard');
                    const promptText = document.getElementById('physique-prompt').value.trim();

                    btnRecalc.disabled = true;
                    loading.style.display = 'block';
                    dash.style.opacity = '0.3';

                    try {
                        const { data: { user } } = await window.supabaseClient.auth.getUser();

                        // Fetch profile for biometric context
                        let profile = null;
                        if (user) {
                            const { data } = await window.supabaseClient
                                .from('profiles').select('*').eq('id', user.id).single();
                            profile = data;
                        }

                        // Real AI call via Gemini
                        const resp = await fetch('/api/calc-volumes', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                aesthetic_target:  promptText,
                                height_cm:         profile?.height_cm,
                                weight_kg:         profile?.weight_kg,
                                metabolic_goal:    profile?.metabolic_goal,
                                age:               profile?.age,
                                gender:            profile?.gender
                            })
                        });

                        const respData = await resp.json();
                        if (!resp.ok) throw new Error(respData.error || 'Erro na chamada à IA');

                        const newVolumes  = respData.volumes || respData; // backward compat
                        const rationale   = respData.rationale   || null;
                        const weeklySplit = respData.weekly_split || null;

                        // Add pillStyle for rendering
                        const styledVolumes = newVolumes.map(v => ({
                            ...v,
                            pillStyle: v.label === 'Manutenção'
                                ? `color: ${v.color}; padding: 2px 8px; font-size: 0.75rem; font-weight: bold; border: 1px solid var(--glass-border); border-radius: 12px;`
                                : `background: ${v.color}; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;`
                        }));

                        this.state.simulatedVolumes = styledVolumes;
                        this.state.targetPhysique   = promptText;
                        this.state.aiRationale      = rationale;
                        this.state.weeklySplit      = weeklySplit;

                        if (user) {
                            await window.supabaseClient.from('physique_architect').insert([{
                                user_id: user.id,
                                master_prompt: promptText,
                                weekly_volumes_json: { volumes: styledVolumes, rationale, weekly_split: weeklySplit }
                            }]);
                        }

                        this.render();
                    } catch (err) {
                        alert('Erro ao recalcular volumes: ' + err.message);
                        btnRecalc.disabled = false;
                        loading.style.display = 'none';
                        dash.style.opacity = '1';
                    }
                });
            }

            // "Relatar" buttons in weekly tab
            document.querySelectorAll('.btn-relatar').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.getAttribute('data-day-index'));
                    this.state.reportingDay = this.state.weeklySplit[idx];
                    this.state.activeTab = 'report';
                    this.render();
                });
            });

            // Save workout report
            const btnSaveReport = document.getElementById('btn-save-report');
            if (btnSaveReport) {
                btnSaveReport.addEventListener('click', async () => {
                    btnSaveReport.disabled = true;
                    btnSaveReport.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

                    try {
                        const { data: { user } } = await window.supabaseClient.auth.getUser();
                        if (!user) throw new Error("Usuário não logado");

                        const day = this.state.reportingDay;
                        const allExercises = (day.groups || []).flatMap(g => {
                            const perEx = this._distributeSets(g.sets, (g.exercises || []).length);
                            return (g.exercises || []).map((ex, i) => ({ name: ex, muscle: g.muscle, sets: perEx[i] }));
                        });

                        const exercisesLog = allExercises.map((ex, i) => ({
                            name:   ex.name,
                            muscle: ex.muscle,
                            sets:   parseInt(document.querySelector(`.report-sets[data-ex="${i}"]`)?.value)   || ex.sets,
                            weight: parseFloat(document.querySelector(`.report-weight[data-ex="${i}"]`)?.value) || 0,
                            reps:   parseInt(document.querySelector(`.report-reps[data-ex="${i}"]`)?.value)   || 0,
                            note:   document.querySelector(`.report-note[data-ex="${i}"]`)?.value || '',
                        }));

                        // Ensure profile exists (FK constraint)
                        const { error: profErr } = await window.supabaseClient
                            .from('profiles')
                            .upsert(
                                { id: user.id, first_name: user.email?.split('@')[0] || 'User' },
                                { onConflict: 'id', ignoreDuplicates: true }
                            );
                        if (profErr) throw new Error('Erro ao criar perfil base: ' + profErr.message);

                        const { error } = await window.supabaseClient
                            .from('workout_executions')
                            .insert([{
                                user_id:            user.id,
                                log_date:           new Date().toISOString().split('T')[0],
                                workout_title:      `${day.day} — ${day.label || ''}`,
                                exercises_log_json: exercisesLog
                            }]);

                        if (error) throw error;

                        btnSaveReport.innerHTML = '<i class="fa-solid fa-check"></i> Treino salvo no histórico!';
                        this.state.reportingDay = null;
                        setTimeout(() => { this.state.activeTab = 'weekly'; this.render(); }, 2000);
                    } catch (err) {
                        alert("Erro ao salvar relatório: " + err.message);
                        btnSaveReport.disabled = false;
                        btnSaveReport.innerHTML = '<i class="fa-solid fa-flag-checkered"></i> Salvar Relatório de Treino';
                    }
                });
            }
        }
    };

    window.WorkoutModule = WorkoutModule;

})();
