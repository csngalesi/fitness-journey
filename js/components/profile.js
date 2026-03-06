/**
 * Fitness Journey MED - User Profile & Biometrics Module
 */

(function () {
    'use strict';

    const ProfileModule = {
        state: {
            user: {
                name: 'Christiano',
                height: 182, // cm
                age: 38,
                gender: 'M',
                goal: 'gain' // 'lose', 'maintain', 'gain', 'recomp'
            }
        },

        render() {
            const container = document.getElementById('profile-content-area');

            container.innerHTML = `
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--primary) 0%, #ff4b2b 100%); margin: 0 auto 1rem auto; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: #fff; font-family: var(--font-display); box-shadow: 0 0 15px rgba(255, 65, 108, 0.4);">
                        ${this.state.user.name.charAt(0)}
                    </div>
                    <h4 style="margin-bottom: 0.2rem;">${this.state.user.name}</h4>
                    <span style="color: var(--text-muted); font-size: 0.85rem;">Plano Superávit Estético</span>
                </div>

                <div class="card mb-4" style="border: 1px solid var(--primary-light);">
                    <h5 style="color: var(--primary); margin-bottom: 1rem;"><i class="fa-solid fa-fingerprint"></i> Biometria Base</h5>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.5rem;">
                        Estes dados ancoram os cálculos matemáticos da <strong>Inteligência Artificial</strong> (Ex: Usando a altura para calcular o volume corporal ao analisar suas fotos de Avaliação).
                    </p>

                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <div>
                            <label style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Altura (cm)</label>
                            <input type="number" id="profile-height" class="form-control" value="${this.state.user.height}">
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div>
                                <label style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Idade</label>
                                <input type="number" id="profile-age" class="form-control" value="${this.state.user.age}">
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Gênero Biológico</label>
                                <select id="profile-gender" class="form-control" style="background-color: rgba(255, 255, 255, 0.05); color: #fff;">
                                    <option value="M" ${this.state.user.gender === 'M' ? 'selected' : ''}>Masculino</option>
                                    <option value="F" ${this.state.user.gender === 'F' ? 'selected' : ''}>Feminino</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Alvo Metabólico Principal</label>
                            <select id="profile-goal" class="form-control" style="background-color: rgba(255, 255, 255, 0.05); color: #fff;">
                                <option value="lose" ${this.state.user.goal === 'lose' ? 'selected' : ''}>Cutting (Secar / Reduzir BF)</option>
                                <option value="maintain" ${this.state.user.goal === 'maintain' ? 'selected' : ''}>Manutenção Estratégica</option>
                                <option value="gain" ${this.state.user.goal === 'gain' ? 'selected' : ''}>Bulking Limpo (Ganho de Massa)</option>
                                <option value="recomp" ${this.state.user.goal === 'recomp' ? 'selected' : ''}>Recomposição Corporal</option>
                            </select>
                        </div>
                    </div>

                    <button class="btn btn-primary mt-4" id="btn-save-profile" style="width: 100%;">
                        <i class="fa-solid fa-cloud-arrow-up"></i> Atualizar Matriz Biológica
                    </button>
                    <div id="profile-feedback" style="display:none; text-align:center; color: #28a745; font-size: 0.85rem; margin-top: 0.8rem;">
                        <i class="fa-solid fa-circle-check"></i> Variáveis salvas! A IA usará estes dados na próxima requisição.
                    </div>
                </div>
            `;

            this.bindEvents();
        },

        bindEvents() {
            const btnSave = document.getElementById('btn-save-profile');
            const feedback = document.getElementById('profile-feedback');

            if (btnSave) {
                btnSave.addEventListener('click', () => {
                    this.state.user.height = parseInt(document.getElementById('profile-height').value);
                    this.state.user.age = parseInt(document.getElementById('profile-age').value);
                    this.state.user.gender = document.getElementById('profile-gender').value;
                    this.state.user.goal = document.getElementById('profile-goal').value;

                    // Mock Saving Event
                    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Atualizando...';
                    feedback.style.display = 'none';

                    setTimeout(() => {
                        btnSave.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Atualizar Matriz Biológica';
                        feedback.style.display = 'block';

                        setTimeout(() => {
                            feedback.style.display = 'none';
                        }, 3000);
                    }, 800);
                });
            }
        }
    };

    window.ProfileModule = ProfileModule;

})();
