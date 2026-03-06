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

        async render() {
            const container = document.getElementById('profile-content-area');

            // Loading state
            container.innerHTML = `<p style="text-align:center; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Carregando matriz biológica da nuvem...</p>`;

            try {
                // Get Auth User
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                if (!user) throw new Error("Não autenticado");

                // Fetch real profile from DB
                const { data: profile, error } = await window.supabaseClient
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    this.state.user.name = profile.name || user.email.split('@')[0];
                    this.state.user.height = profile.height_cm || 182;
                    this.state.user.age = profile.age || 30;
                    this.state.user.gender = profile.gender || 'M';
                    this.state.user.goal = profile.metabolic_goal || 'maintain';
                } else {
                    this.state.user.name = user.email.split('@')[0];
                }
            } catch (err) {
                console.warn("Nenhum perfil prévio encontrado ou erro de rede. Usando defaults.", err);
            }

            container.innerHTML = `
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--primary) 0%, #ff4b2b 100%); margin: 0 auto 1rem auto; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: #fff; font-family: var(--font-display); box-shadow: 0 0 15px rgba(255, 65, 108, 0.4);">
                        ${this.state.user.name.charAt(0).toUpperCase()}
                    </div>
                    <h4 style="margin-bottom: 0.2rem;">${this.state.user.name}</h4>
                    <span style="color: var(--text-muted); font-size: 0.85rem;">Sincronizado via Supabase</span>
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
                        <i class="fa-solid fa-circle-check"></i> 
                    </div>
                </div>
            `;

            this.bindEvents();
        },

        bindEvents() {
            const btnSave = document.getElementById('btn-save-profile');
            const feedback = document.getElementById('profile-feedback');

            if (btnSave) {
                btnSave.addEventListener('click', async () => {
                    this.state.user.height = parseInt(document.getElementById('profile-height').value);
                    this.state.user.age = parseInt(document.getElementById('profile-age').value);
                    this.state.user.gender = document.getElementById('profile-gender').value;
                    this.state.user.goal = document.getElementById('profile-goal').value;

                    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando na nuvem...';
                    btnSave.disabled = true;
                    feedback.style.display = 'none';

                    try {
                        const { data: { user } } = await window.supabaseClient.auth.getUser();
                        if (!user) throw new Error("Usuário não logado");

                        const { error } = await window.supabaseClient
                            .from('profiles')
                            .upsert({
                                id: user.id,
                                name: this.state.user.name,
                                height_cm: this.state.user.height,
                                age: this.state.user.age,
                                gender: this.state.user.gender,
                                metabolic_goal: this.state.user.goal
                            });

                        if (error) throw error;

                        feedback.innerHTML = '<i class="fa-solid fa-circle-check"></i> Variáveis sincronizadas no Supabase com sucesso!';
                        feedback.style.color = '#28a745';
                    } catch (err) {
                        feedback.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Erro ao sincronizar: ' + err.message;
                        feedback.style.color = '#dc3545';
                    } finally {
                        btnSave.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Atualizar Matriz Biológica';
                        btnSave.disabled = false;
                        feedback.style.display = 'block';
                        setTimeout(() => { feedback.style.display = 'none'; }, 4000);
                    }
                });
            }
        }
    };

    window.ProfileModule = ProfileModule;

})();
