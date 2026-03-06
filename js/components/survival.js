/**
 * Fitness Journey MED - Survival Guide Module
 */

(function () {
    'use strict';

    const SurvivalModule = {
        state: {
            activeCategory: 'car-trip', // car-trip, airport, delivery, party
            snackOptions: {
                'car-trip': [
                    { id: 1, name: 'Whey Protein (Dose Pronta)', macros: '25g P | 3g C | 1g G', description: 'Levar shakeira com o pó e comprar água no posto. Absorção rápida mediada por soro do leite.', grade: 'A+' },
                    { id: 2, name: 'Barra de Proteína (Low Sugar)', macros: '18g P | 15g C | 6g G', description: 'Verificar rótulo se carboidrato não é predominantemente maltodextrina.', grade: 'B' },
                    { id: 3, name: 'Mix de Castanhas (30g)', macros: '5g P | 8g C | 15g G', description: 'Alta densidade calórica. Ótimo para saciedade prolongada em viagens de longo curso. Cuidado com o excedente.', grade: 'B+' }
                ],
                'airport': [
                    { id: 4, name: 'Salada com Grelhado', macros: 'Varíavel', description: 'Pedir molho à parte. Evitar croutons e queijos amarelos pesados antes de voar.', grade: 'A' },
                    { id: 5, name: 'Wrap de Frango Integral', macros: '20g P | 35g C | 8g G', description: 'Restaurantes como Subway ou cafés. Boa proporção de macronutrientes.', grade: 'B+' }
                ],
                'delivery': [
                    { id: 6, name: 'Poke (Atum/Salmão Grelhado)', macros: '30g P | 40g C | 10g G', description: 'Pedir base de mix de folhas + pouco arroz. Molho Shoyu Light separado.', grade: 'A' },
                    { id: 7, name: 'Temaki sem Cream Cheese', macros: '15g P | 30g C | 2g G', description: 'Limpo, rápido. Priorizar peixe branco ou atum se estiver em cutting rígido.', grade: 'A-' },
                    { id: 8, name: 'Hambúrguer Artesanal (Apenas pão e carne)', macros: '25g P | 30g C | 15g G', description: 'Estratégia de redução de danos (tirar bacon, queijo gordo e maionese).', grade: 'C+' }
                ],
                'party': [
                    { id: 9, name: 'Estratégia Zero Álcool', macros: '0 kcal extras', description: 'Água com gás, limão espremido e gelo (simula gin tônica no visual).', grade: 'A+' },
                    { id: 10, name: 'Destilado + Zero', macros: 'aprox. 100kcal/dose', description: 'Gin ou Vodka com tônica zero/energético zero. Álcool não vira gordura diretamente, mas paralisa a oxidação (queima) lipídica do dia.', grade: 'C' }
                ]
            }
        },

        render() {
            const container = document.getElementById('survival-content-area');

            container.innerHTML = `
                <!-- Context Tabs Layout -->
                <div style="display:flex; overflow-x: auto; border-bottom: 2px solid var(--glass-border); margin-bottom: 1.5rem; white-space: nowrap; scrollbar-width: none; pb-2;">
                    
                    <div class="survival-tab ${this.state.activeCategory === 'car-trip' ? 'active' : ''}" data-cat="car-trip" style="padding: 0.8rem 1.2rem; cursor:pointer; font-weight: bold; color: ${this.state.activeCategory === 'car-trip' ? 'var(--primary)' : 'var(--text-muted)'}; border-bottom: ${this.state.activeCategory === 'car-trip' ? '2px solid var(--primary)' : 'none'};">
                        <i class="fa-solid fa-car-side"></i> Viagem/Posto
                    </div>
                    
                    <div class="survival-tab ${this.state.activeCategory === 'airport' ? 'active' : ''}" data-cat="airport" style="padding: 0.8rem 1.2rem; cursor:pointer; font-weight: bold; color: ${this.state.activeCategory === 'airport' ? 'var(--primary)' : 'var(--text-muted)'}; border-bottom: ${this.state.activeCategory === 'airport' ? '2px solid var(--primary)' : 'none'};">
                        <i class="fa-solid fa-plane-departure"></i> Aeroporto
                    </div>
                    
                    <div class="survival-tab ${this.state.activeCategory === 'delivery' ? 'active' : ''}" data-cat="delivery" style="padding: 0.8rem 1.2rem; cursor:pointer; font-weight: bold; color: ${this.state.activeCategory === 'delivery' ? 'var(--primary)' : 'var(--text-muted)'}; border-bottom: ${this.state.activeCategory === 'delivery' ? '2px solid var(--primary)' : 'none'};">
                        <i class="fa-solid fa-motorcycle"></i> iFood/Delivery
                    </div>

                    <div class="survival-tab ${this.state.activeCategory === 'party' ? 'active' : ''}" data-cat="party" style="padding: 0.8rem 1.2rem; cursor:pointer; font-weight: bold; color: ${this.state.activeCategory === 'party' ? 'var(--primary)' : 'var(--text-muted)'}; border-bottom: ${this.state.activeCategory === 'party' ? '2px solid var(--primary)' : 'none'};">
                        <i class="fa-solid fa-champagne-glasses"></i> Festas/Bar
                    </div>

                </div>

                <!-- Guidance Info -->
                <div style="background: rgba(255, 65, 108, 0.1); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--primary); margin-bottom: 1.5rem;">
                    <p style="font-size: 0.85rem; margin: 0; color: var(--text-main);">
                        <i class="fa-solid fa-triangle-exclamation" style="color: var(--primary);"></i> <strong>Protocolo de Exceção:</strong> 
                        Opções otimizadas baseadas na restrição do ambiente. Selecione o evento onde você está.
                    </p>
                </div>

                <!-- Options List -->
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    ${this.renderOptions()}
                </div>

                <!-- SOS Button Action -->
                <div class="card mt-4" style="background: rgba(255,255,255,0.02); text-align: center; border: 1px dashed var(--glass-border);">
                    <i class="fa-solid fa-robot" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <h6 style="color: var(--text-main);">Nada Disso Ajuda?</h6>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">Tire uma foto do cardápio ou prateleira e deixe a IA rastrear as macros para você.</p>
                    <button class="btn btn-primary" onclick="alert('Funcionalidade de Scanner Visual de Rótulos em construção no Backend Gemini API!')"><i class="fa-solid fa-camera"></i> Escanear Local</button>
                </div>
            `;

            this.bindEvents();
        },

        renderOptions() {
            const currentOptions = this.state.snackOptions[this.state.activeCategory] || [];

            if (currentOptions.length === 0) {
                return '<div style="text-align:center; color: var(--text-muted);">Nenhuma opção cadastrada.</div>';
            }

            return currentOptions.map(opt => {
                let gradeColor = opt.grade.includes('A') ? '#28a745' : (opt.grade.includes('B') ? '#f39c12' : '#e74c3c');

                return `
                <div style="background: var(--bg-dark); padding: 1.2rem; border-radius: 12px; border: 1px solid var(--glass-border); position: relative;">
                    <span style="position: absolute; top: 12px; right: 12px; font-weight: 900; font-family: var(--font-display); font-size: 1.2rem; color: ${gradeColor}; opacity: 0.8;">
                        ${opt.grade}
                    </span>
                    
                    <h6 style="color: var(--text-main); margin-bottom: 0.3rem; padding-right: 30px;">${opt.name}</h6>
                    <span style="display:inline-block; font-size: 0.75rem; background: var(--bg-card); padding: 3px 8px; border-radius: 6px; color: var(--primary-light); margin-bottom: 0.8rem; border: 1px solid rgba(255,255,255,0.05); font-family: monospace;">
                        <i class="fa-solid fa-chart-pie"></i> ${opt.macros}
                    </span>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0; line-height: 1.4;">
                        ${opt.description}
                    </p>
                </div>
                `;
            }).join('');
        },

        bindEvents() {
            const tabs = document.querySelectorAll('.survival-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    const selectedCat = e.currentTarget.getAttribute('data-cat');
                    if (this.state.activeCategory !== selectedCat) {
                        this.state.activeCategory = selectedCat;
                        this.render();
                    }
                });
            });
        }
    };

    window.SurvivalModule = SurvivalModule;

})();
