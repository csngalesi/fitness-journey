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
                        const entriesMap = {};
                        logs.forEach(log => {
                            const key = log.log_date;
                            if (!entriesMap[key]) {
                                entriesMap[key] = { title: log.title, date: log.log_date, images: [] };
                            }
                            entriesMap[key].images.push({
                                bf: log.bf_percentage,
                                weight: log.weight_kg,
                                url: log.image_url
                            });
                        });
                        this.state.entries = Object.values(entriesMap).sort((a, b) => new Date(b.date) - new Date(a.date));
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
                        <i class="fa-solid fa-camera"></i> Escolher Fotos (Análise IA)
                    </button>
                    <input type="file" id="file-input" accept="image/*" multiple style="display: none;">
                    
                    <div id="photo-ai-loading" style="display:none; text-align:center; margin-top:1.5rem; color: var(--primary-light);">
                        <i class="fa-solid fa-robot fa-bounce"></i> IA escaneando composição corporal (Cálculo de BF e Peso)...
                    </div>
                    
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

                    document.getElementById('photo-ai-loading').style.display = 'block';
                    document.getElementById('btn-upload-photo').disabled = true;

                    // Simulate AI Processing (2s delay)
                    setTimeout(() => {
                        // Mock AI generated baseline for this batch
                        const baseWeight = 80 + (Math.random() * 2 - 1);
                        const baseBf = 14 + (Math.random() * 3 - 1.5);

                        const stagedImages = [];

                        Array.from(files).forEach(file => {
                            const url = URL.createObjectURL(file);

                            // Slight variance per photo for the prototype effect
                            const imgBf = baseBf + (Math.random() * 0.4 - 0.2);
                            const imgWeight = baseWeight + (Math.random() * 0.2 - 0.1);

                            stagedImages.push({
                                file: file,
                                bf: parseFloat(imgBf.toFixed(1)),
                                weight: parseFloat(imgWeight.toFixed(1)),
                                url: url
                            });
                        });

                        this.state.staging = {
                            title: title,
                            date: date,
                            images: stagedImages
                        };

                        document.getElementById('photo-ai-loading').style.display = 'none';
                        this.renderStaging();

                    }, 2000);
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
            stagingDiv.innerHTML = `
                <div style="font-size: 0.85rem; color: var(--primary); margin-bottom: 0.8rem; text-align: center;">
                    <i class="fa-solid fa-check-circle"></i> Análise concluída. ${imgCount} foto(s) prontas.
                </div>
                <button class="btn btn-primary" id="btn-save-record" style="width: 100%; padding: 0.8rem;">
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

                    // Process each image sequentially (could be parallelized, but simpler to track progress)
                    for (const img of s.images) {
                        const fileExt = img.file.name.split('.').pop();
                        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                        // Upload to Storage
                        const { error: uploadError, data: uploadData } = await window.supabaseClient.storage
                            .from('evolution_photos')
                            .upload(fileName, img.file);

                        if (uploadError) throw uploadError;

                        // Get Public URL
                        const { data: urlData } = window.supabaseClient.storage
                            .from('evolution_photos')
                            .getPublicUrl(fileName);

                        const publicUrl = urlData.publicUrl;

                        // Insert into evolution_logs
                        const { error: dbError } = await window.supabaseClient
                            .from('evolution_logs')
                            .insert([{
                                user_id: user.id,
                                log_date: s.date,
                                title: s.title,
                                bf_percentage: img.bf,
                                weight_kg: img.weight,
                                image_url: publicUrl
                            }]);

                        if (dbError) throw dbError;
                    }

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
                let sumBf = 0, countBf = 0;
                let sumWeight = 0, countWeight = 0;

                entry.images.forEach(img => {
                    if (img.bf !== null && !isNaN(img.bf)) { sumBf += img.bf; countBf++; }
                    if (img.weight !== null && !isNaN(img.weight)) { sumWeight += img.weight; countWeight++; }
                });

                const avgBf = countBf > 0 ? (sumBf / countBf).toFixed(1) : '?';
                const avgWeight = countWeight > 0 ? (sumWeight / countWeight).toFixed(1) : '?';

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
