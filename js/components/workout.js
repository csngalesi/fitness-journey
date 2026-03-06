/**
 * Fitness Journey MED - Workout & Physique Architect Module
 */

(function () {
    'use strict';

    const WorkoutModule = {
        state: {
            activeTab: 'architect', // 'architect' or 'daily'
            targetPhysique: 'Frank Zane (V-Shape Clássico)',
            focusAreas: ['Dorsal (Expansão)', 'Deltoide Lateral (Cebola)', 'Peitoral Superior'],
            dailyWorkout: {
                title: 'A | Push Focado (Peito/Ombro/Tríceps)',
                exercises: [
                    { id: 1, name: 'Supino Inclinado c/ Halteres', targetSets: 4, targetReps: '8-12', history: { weight: 34, reps: 10 } },
                    { id: 2, name: 'Elevação Lateral no Cabo', targetSets: 5, targetReps: '12-15', history: { weight: 15, reps: 14 } },
                    { id: 3, name: 'Crucifixo no Cross (De baixo p/ cima)', targetSets: 3, targetReps: '10-15', history: { weight: 20, reps: 12 } },
                    { id: 4, name: 'Tríceps Corda', targetSets: 4, targetReps: '10-12', history: { weight: 45, reps: 10 } }
                ]
            }
        },

        render() {
            const container = document.getElementById('workout-content-area');

            container.innerHTML = `
                <!-- Tabs Navigation -->
                <div style="display:flex; border-bottom: 2px solid var(--glass-border); margin-bottom: 1.5rem;">
                    <div class="workout-tab ${this.state.activeTab === 'architect' ? 'active' : ''}" data-tab="architect" style="flex:1; text-align:center; padding: 0.8rem; cursor:pointer; font-weight: bold; color: ${this.state.activeTab === 'architect' ? 'var(--primary)' : 'var(--text-muted)'}; border-bottom: ${this.state.activeTab === 'architect' ? '2px solid var(--primary)' : 'none'}; margin-bottom: -2px;">
                        <i class="fa-solid fa-compass-drafting"></i> O Arquiteto
                    </div>
                    <div class="workout-tab ${this.state.activeTab === 'daily' ? 'active' : ''}" data-tab="daily" style="flex:1; text-align:center; padding: 0.8rem; cursor:pointer; font-weight: bold; color: ${this.state.activeTab === 'daily' ? 'var(--primary)' : 'var(--text-muted)'}; border-bottom: ${this.state.activeTab === 'daily' ? '2px solid var(--primary)' : 'none'}; margin-bottom: -2px;">
                        <i class="fa-solid fa-dumbbell"></i> Treino do Dia
                    </div>
                </div>

                <!-- Tab Contents -->
                <div id="tab-architect" style="display: ${this.state.activeTab === 'architect' ? 'block' : 'none'};">
                    ${this.renderArchitectTab()}
                </div>
                
                <div id="tab-daily" style="display: ${this.state.activeTab === 'daily' ? 'block' : 'none'};">
                    ${this.renderDailyTab()}
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
                    <textarea class="form-control" rows="4" style="background: var(--bg-card); font-family: 'Courier New', Courier, monospace; font-size: 0.85rem; border: 1px dashed var(--glass-border);">Quero o físico estético do Frank Zane. Foco máximo na silhueta (V-Shape): peitoral superior bem marcado, ombros largos e arredondados, dorsais densas e um abdômen core trabalhado. Atualmente sinto que meus braços respondem rápido, então posso colocar em volume de manutenção para focar nos ombros.</textarea>
                    
                    <button class="btn btn-primary mt-3" style="width: 100%;" onclick="alert('Na versão final, o Gemini analisará este prompt + suas fotos da galeria para calcular as Séries Semanais ótimas.')">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Recalcular Volumes (Plano Mensal)
                    </button>
                </div>

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
        },

        renderDailyTab() {
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h5 style="color: var(--primary); margin:0;">${this.state.dailyWorkout.title}</h5>
                    <button class="btn-icon" style="background: var(--bg-card); border: 1px solid var(--glass-border);"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                </div>
                
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.5rem;">
                    Sua IA personalizou este treino focando 60% do volume na porção clavicular do peito e em elevações laterais para alargar a silhueta (Modelo Frank Zane).
                </p>

                <div style="display: flex; flex-direction: column; gap: 1.2rem;">
                    ${this.state.dailyWorkout.exercises.map((ex, index) => `
                        <div style="background: var(--bg-dark); border-radius: 12px; border: 1px solid var(--glass-border); overflow: hidden;">
                            <div style="padding: 1rem; background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--glass-border);">
                                <div style="display:flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                    <strong style="font-size: 0.9rem;">${index + 1}. ${ex.name}</strong>
                                    <span style="color: var(--primary-light); font-size: 0.8rem; font-weight: bold;">Algoritmo: ${ex.targetSets} x ${ex.targetReps}</span>
                                </div>
                                
                                <div style="display:flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); background: var(--bg-card); padding: 0.5rem; border-radius: 6px;">
                                    <span><i class="fa-solid fa-clock-rotate-left"></i> Semana Passada:</span>
                                    <strong style="color: #fff;">${ex.history.weight}kg para ${ex.history.reps} reps</strong>
                                </div>
                            </div>
                            
                            <!-- Input para Overload Carga -->
                            <div style="padding: 1rem; display: flex; gap: 0.5rem; align-items: center;">
                                <div style="flex: 1;">
                                    <label style="font-size: 0.7rem; color: var(--text-muted); text-transform:uppercase;">Volume/Carga Executada Hoje</label>
                                    <div style="display: flex; gap: 0.5rem;">
                                        <input type="number" class="form-control" placeholder="Peso (kg)" style="padding: 0.5rem; text-align:center;">
                                        <input type="number" class="form-control" placeholder="Reps" style="padding: 0.5rem; text-align:center;">
                                    </div>
                                </div>
                                <button class="btn-icon" style="background: var(--primary); color: white; border-radius: 8px; height: 38px; width: 45px; margin-top: 15px;">
                                    <i class="fa-solid fa-check"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <button class="btn btn-primary mt-4" style="width: 100%; padding: 1rem; background: #28a745; border-color: #28a745;">
                    <i class="fa-solid fa-flag-checkered"></i> Concluir Treino (Salvar Histórico)
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
        }
    };

    window.WorkoutModule = WorkoutModule;

})();
