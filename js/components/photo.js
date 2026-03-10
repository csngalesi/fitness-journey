/**
 * Fitness Journey MED - Progress Photos Module
 */

(function () {
    'use strict';

    const PhotoModule = {
        state: {
            staging: null,
            entries: []
        },

        async render() {
            const container = document.getElementById('photo-content-area');
            container.innerHTML = `<p style="text-align:center; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Baixando galeria sincronizada com a nuvem...</p>`;

            try {
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                if (user) {
                    const { data: logs, error } = await window.supabaseClient
                        .from('evolution_logs')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('log_date', { ascending: false });

                    if (logs) {
                        this.state.entries = logs.map(log => ({
                            title: log.title,
                            date: log.log_date,
                            bf: log.average_bf,
                            weight: log.average_weight,
                            images: (log.photos_urls || []).map(url => ({ url }))
                        }));
                    }
                }
            } catch (err) {
                console.warn("Could not fetch photo logs:", err);
            }

            container.innerHTML = `
                <div class="macro-summary mb-3" style="font-size: 0.9rem; text-align: center;">
                    <strong>Seu Progresso de Composição Corporal</strong><br>
                    <span style="color:var(--text-muted)">O espelho é o seu melhor avaliador.</span>
                </div>
                
                <div style="background: var(--bg-dark); padding: 1rem; border-radius: 12px; border: 1px dashed var(--primary); text-align: center; margin-bottom: 2rem;" id="upload-box">
                    <i class="fa-solid fa-cloud-arrow-up" style="font-size: 2rem; color: var(--primary); margin-bottom: 0.5rem;"></i>
                    <h5 style="margin-bottom: 0.5rem;">Adicionar Novas Fotos</h5>
                    
                    <div style="display:flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; margin-bottom: 1rem;">
                        <input type="text" id="photo-title" class="form-control" placeholder='Ex: "Término da Quaresma" ou "Fim do Bulking"'>
                        <input type="date" id="photo-date" class="form-control" style="padding: 0.5rem; color: var(--text-muted);" value="${new Date().toISOString().split('T')[0]}">
                    </div>

                    <button class="btn btn-primary" id="btn-upload-photo" style="padding: 0.5rem 2rem;">
                        <i class="fa-solid fa-camera"></i> Escolher Fotos
                    </button>
                    <input type="file" id="file-input" accept="image/*" multiple style="display: none;">

                    <div id="photo-staging" style="display:none; margin-top: 1rem; text-align: left;">
                    </div>
                </div>
                
                <h4 class="mt-4 mb-3" style="font-family: var(--font-display);">Galeria de Evolução</h4>
                <div id="gallery-list" style="display:flex; flex-direction:column; gap:1.2rem;">
                </div>
            `;

            this.bindEvents();
            this.renderGallery();
        },

        bindEvents() {
            const btnUpload = document.getElementById('btn-upload-photo');
            const fileInput = document.getElementById('file-input');
            const uploadBox = document.getElementById('upload-box');

            btnUpload.addEventListener('click', () => {
                fileInput.click();
            });

            fileInput.addEventListener('change', (e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                    const date = document.getElementById('photo-date').value;
                    const title = document.getElementById('photo-title').value.trim() || 'Avaliação Física';

                    const stagedImages = Array.from(files).map(file => ({
                        file,
                        bf: null,
                        weight: null,
                        url: URL.createObjectURL(file)
                    }));

                    this.state.staging = { title, date, images: stagedImages };
                    this.renderStaging();
                }
            });
        },

        renderStaging() {
            const stagingDiv = document.getElementById('photo-staging');
            if (!this.state.staging) {
                stagingDiv.style.display = 'none';
                return;
            }

            const imgCount = this.state.staging.images.length;
            stagingDiv.style.display = 'block';

            const photoInputRows = this.state.staging.images.map((img, idx) => `
                <div style="display:flex; gap:0.5rem; align-items:center; padding:0.5rem 0; border-bottom:1px solid var(--glass-border);">
                    <img src="${img.url}" style="width:48px; height:48px; object-fit:cover; border-radius:6px; flex-shrink:0;">
                    <input type="number" class="form-control bf-input" data-idx="${idx}" placeholder="BF (%)" step="0.1" style="flex:1; padding:0.4rem 0.5rem; font-size:0.85rem;">
                    <input type="number" class="form-control weight-input" data-idx="${idx}" placeholder="Peso (kg)" step="0.1" style="flex:1; padding:0.4rem 0.5rem; font-size:0.85rem;">
                </div>
            `).join('');

            stagingDiv.innerHTML = `
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.6rem;">
                    <i class="fa-solid fa-pen-to-square" style="color:var(--primary);"></i> Informe BF% e peso para cada foto:
                </div>
                ${photoInputRows}
                <button class="btn btn-primary mt-3" id="btn-save-record" style="width: 100%; padding: 0.8rem;">
                    <i class="fa-solid fa-floppy-disk"></i> Salvar Registro Clínico
                </button>
                <button class="btn mt-2" id="btn-cancel-staging" style="width: 100%; padding: 0.5rem; background: transparent; border: 1px solid var(--glass-border); color: var(--text-muted);">Cancelar</button>
            `;

            document.getElementById('btn-save-record').addEventListener('click', async () => {
                const s = this.state.staging;
                const btnSave = document.getElementById('btn-save-record');
                btnSave.disabled = true;
                btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Armazenando e Processando...';

                try {
                    const { data: { user } } = await window.supabaseClient.auth.getUser();
                    if (!user) throw new Error("Usuário não logado");

                    // Upload all images, collect public URLs
                    const publicUrls = [];
                    for (const img of s.images) {
                        const fileExt = img.file.name.split('.').pop();
                        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                        const { error: uploadError } = await window.supabaseClient.storage
                            .from('evolution_photos')
                            .upload(fileName, img.file);

                        if (uploadError) throw uploadError;

                        const { data: urlData } = window.supabaseClient.storage
                            .from('evolution_photos')
                            .getPublicUrl(fileName);

                        publicUrls.push(urlData.publicUrl);
                    }

                    // Read manual BF/weight inputs and compute averages
                    const bfInputs     = document.querySelectorAll('#photo-staging .bf-input');
                    const weightInputs = document.querySelectorAll('#photo-staging .weight-input');
                    bfInputs.forEach((el, i)     => { s.images[i].bf     = parseFloat(el.value)     || null; });
                    weightInputs.forEach((el, i) => { s.images[i].weight = parseFloat(el.value) || null; });

                    const validBf     = s.images.map(i => i.bf).filter(v => v !== null);
                    const validWeight = s.images.map(i => i.weight).filter(v => v !== null);
                    const avgBf     = validBf.length     ? parseFloat((validBf.reduce((a, b) => a + b, 0)     / validBf.length).toFixed(1))     : null;
                    const avgWeight = validWeight.length ? parseFloat((validWeight.reduce((a, b) => a + b, 0) / validWeight.length).toFixed(1)) : null;

                    // Insert one record per session
                    const { error: dbError } = await window.supabaseClient
                        .from('evolution_logs')
                        .insert([{
                            user_id: user.id,
                            log_date: s.date,
                            title: s.title,
                            average_bf: avgBf,
                            average_weight: avgWeight,
                            photos_urls: publicUrls
                        }]);

                    if (dbError) throw dbError;

                    // Reset and refresh data from Supabase to show real URLs
                    this.state.staging = null;
                    document.getElementById('photo-title').value = '';
                    document.getElementById('file-input').value = '';
                    document.getElementById('btn-upload-photo').disabled = false;

                    await this.render(); // Refetches all logs and redraws entire screen
                } catch (err) {
                    alert("Erro ao salvar fotos: " + err.message);
                    btnSave.disabled = false;
                    btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Registro Clínico';
                }
            });

            document.getElementById('btn-cancel-staging').addEventListener('click', () => {
                this.state.staging = null;
                document.getElementById('file-input').value = '';
                document.getElementById('btn-upload-photo').disabled = false;
                this.renderStaging();
            });
        },

        renderGallery() {
            const list = document.getElementById('gallery-list');

            if (this.state.entries.length === 0) {
                list.innerHTML = `<div style="color:var(--text-muted); font-size:0.8rem; text-align:center; padding: 2rem 0;">Nenhuma foto salva. Não tenha medo de registrar o antes!</div>`;
                return;
            }

            list.innerHTML = this.state.entries.map(entry => {
                const avgBf = entry.bf != null ? entry.bf : '?';
                const avgWeight = entry.weight != null ? entry.weight : '?';

                const imageCount = entry.images.length;
                const gridCols = Math.min(imageCount, 3);

                return `
                <div style="background:var(--bg-dark); border-radius:12px; overflow:hidden; border:1px solid var(--glass-border);">
                    <div style="padding: 1rem; border-bottom: 1px solid var(--glass-border); display:flex; justify-content: space-between; align-items: start;">
                        <div>
                            <strong style="color:var(--text-main); display:block; margin-bottom: 0.2rem;">${entry.title || 'Avaliação Física'}</strong>
                            <span style="color: var(--primary); font-size:0.8rem;"><i class="fa-regular fa-calendar" style="margin-right: 3px;"></i> ${entry.date}</span>
                        </div>
                        <span style="font-size: 0.8rem; color: var(--text-muted); padding-top: 2px;">${imageCount} foto(s)</span>
                    </div>
                    
                    <div style="display:grid; grid-template-columns: repeat(${gridCols}, 1fr); gap: 2px; background: #000;">
                        ${entry.images.map(img => `
                            <div style="aspect-ratio: 1/1; overflow:hidden;">
                                <img src="${img.url}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9;" alt="Evolução">
                            </div>
                        `).join('')}
                    </div>

                    <div style="padding: 1rem; background: var(--bg-card); display:flex; justify-content: space-around; font-size: 0.9rem;">
                        <div style="text-align:center;">
                            <div style="color:var(--text-muted); font-size: 0.75rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:0.2rem;">Média BF</div>
                            <strong><i class="fa-solid fa-percent" style="color:var(--primary); font-size:0.8rem; margin-right:3px;"></i>${avgBf}${avgBf !== '?' ? '%' : ''}</strong>
                        </div>
                        <div style="width: 1px; background: var(--glass-border);"></div>
                        <div style="text-align:center;">
                            <div style="color:var(--text-muted); font-size: 0.75rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:0.2rem;">Média Peso</div>
                            <strong><i class="fa-solid fa-weight-scale" style="color:var(--primary); font-size:0.8rem; margin-right:3px;"></i>${avgWeight}${avgWeight !== '?' ? 'kg' : ''}</strong>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
        }
    };

    window.PhotoModule = PhotoModule;

})();
