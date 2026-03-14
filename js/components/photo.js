/**
 * Fitness Journey MED - Progress Photos Module
 */

(function () {
    'use strict';

    const PhotoModule = {
        state: {
            staging: null,
            entries: [],
            profile: null
        },

        async render() {
            const container = document.getElementById('photo-content-area');
            container.innerHTML = `<p style="text-align:center; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Baixando galeria sincronizada com a nuvem...</p>`;

            try {
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                if (user) {
                    // Fetch gallery + profile (for AI context)
                    const [logsRes, profileRes] = await Promise.all([
                        window.supabaseClient
                            .from('evolution_logs').select('*')
                            .eq('user_id', user.id).order('log_date', { ascending: false }),
                        window.supabaseClient
                            .from('profiles').select('height_cm, weight_kg')
                            .eq('id', user.id).single()
                    ]);

                    if (logsRes.data) {
                        this.state.entries = logsRes.data.map(log => ({
                            title:  log.title,
                            date:   log.log_date,
                            bf:     log.average_bf,
                            weight: log.average_weight,
                            images: (log.photos_urls || []).map(url => ({ url }))
                        }));
                    }
                    this.state.profile = profileRes.data || null;
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

                    <div id="photo-staging" style="display:none; margin-top: 1rem; text-align: left;"></div>
                </div>

                <h4 class="mt-4 mb-3" style="font-family: var(--font-display);">Galeria de Evolução</h4>
                <div id="gallery-list" style="display:flex; flex-direction:column; gap:1.2rem;"></div>
            `;

            // Lightbox overlay (single instance)
            if (!document.getElementById('fj-lightbox')) {
                const lb = document.createElement('div');
                lb.id = 'fj-lightbox';
                lb.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;cursor:zoom-out;justify-content:center;align-items:center;';
                lb.innerHTML = '<img id="fj-lightbox-img" style="max-width:95vw;max-height:92vh;object-fit:contain;border-radius:8px;box-shadow:0 8px 40px rgba(0,0,0,0.8);touch-action:pinch-zoom;">';
                lb.addEventListener('click', () => { lb.style.display = 'none'; });
                document.body.appendChild(lb);
            }

            this.bindEvents();
            this.renderGallery();
        },

        // Resize image to max 800px and return {base64, mimeType}
        async _resizeImage(file, maxPx = 800) {
            return new Promise((resolve) => {
                const img = new Image();
                const url = URL.createObjectURL(file);
                img.onload = () => {
                    URL.revokeObjectURL(url);
                    const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
                    const canvas = document.createElement('canvas');
                    canvas.width  = Math.round(img.width  * ratio);
                    canvas.height = Math.round(img.height * ratio);
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
                    resolve({
                        base64:   dataUrl.split(',')[1],
                        mimeType: 'image/jpeg',
                        previewUrl: dataUrl
                    });
                };
                img.src = url;
            });
        },

        async _analyzeImage(base64, mimeType) {
            const body = { imageBase64: base64, mimeType };
            if (this.state.profile?.height_cm)  body.height_cm       = this.state.profile.height_cm;
            if (this.state.profile?.weight_kg)   body.weight_kg_last  = this.state.profile.weight_kg;

            const resp = await fetch('/api/analyze-photo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!resp.ok) throw new Error('Erro na análise visual pela IA');
            return resp.json(); // { bf, weight, notes }
        },

        bindEvents() {
            // Gallery lightbox — delegated click on any [data-zoom] image
            document.getElementById('gallery-list').addEventListener('click', (e) => {
                const img = e.target.closest('[data-zoom]');
                if (!img) return;
                const lb = document.getElementById('fj-lightbox');
                document.getElementById('fj-lightbox-img').src = img.dataset.zoom;
                lb.style.display = 'flex';
            });

            const btnUpload = document.getElementById('btn-upload-photo');
            const fileInput = document.getElementById('file-input');

            btnUpload.addEventListener('click', () => fileInput.click());

            fileInput.addEventListener('change', async (e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;

                const date  = document.getElementById('photo-date').value;
                const title = document.getElementById('photo-title').value.trim() || 'Avaliação Física';

                // Show loading staging immediately
                this.state.staging = {
                    title, date,
                    images: Array.from(files).map(file => ({
                        file, bf: null, weight: null, notes: '', url: URL.createObjectURL(file), analyzing: true
                    }))
                };
                this.renderStaging();

                // Analyze each photo with Gemini Vision
                for (let i = 0; i < this.state.staging.images.length; i++) {
                    try {
                        const { base64, mimeType, previewUrl } = await this._resizeImage(files[i]);
                        this.state.staging.images[i].url = previewUrl; // use compressed preview
                        const result = await this._analyzeImage(base64, mimeType);
                        this.state.staging.images[i].bf     = result.bf;
                        this.state.staging.images[i].weight = result.weight;
                        this.state.staging.images[i].notes  = result.notes;
                    } catch (err) {
                        console.warn(`[photo] AI analysis failed for image ${i}:`, err);
                    }
                    this.state.staging.images[i].analyzing = false;
                    this.renderStaging(); // re-render with result
                }
            });
        },

        renderStaging() {
            const stagingDiv = document.getElementById('photo-staging');
            if (!this.state.staging) {
                stagingDiv.style.display = 'none';
                return;
            }

            stagingDiv.style.display = 'block';

            const photoRows = this.state.staging.images.map((img) => {
                if (img.analyzing) {
                    return `
                    <div style="display:flex; gap:0.5rem; align-items:center; padding:0.6rem 0; border-bottom:1px solid var(--glass-border);">
                        <img src="${img.url}" style="width:48px; height:48px; object-fit:cover; border-radius:6px; flex-shrink:0; opacity:0.5;">
                        <div style="flex:1; color:var(--primary-light); font-size:0.82rem;">
                            <i class="fa-solid fa-robot fa-bounce"></i> IA analisando composição corporal...
                        </div>
                    </div>`;
                }
                const bfTag     = img.bf     != null ? `<span style="background:var(--primary); color:#fff; padding:2px 8px; border-radius:10px; font-size:0.78rem; font-weight:700;">${img.bf}% BF</span>`     : '';
                const weightTag = img.weight != null ? `<span style="background:var(--bg-card); color:var(--text-main); padding:2px 8px; border-radius:10px; font-size:0.78rem; border:1px solid var(--glass-border);">${img.weight} kg</span>` : '';
                const notesHtml = img.notes ? `<div style="font-size:0.72rem; color:var(--text-muted); margin-top:4px;">${img.notes}</div>` : '';
                return `
                <div style="display:flex; gap:0.5rem; align-items:flex-start; padding:0.6rem 0; border-bottom:1px solid var(--glass-border);">
                    <img src="${img.url}" style="width:48px; height:48px; object-fit:cover; border-radius:6px; flex-shrink:0;">
                    <div style="flex:1;">
                        <div style="display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center;">
                            ${bfTag} ${weightTag}
                            ${!bfTag && !weightTag ? '<span style="font-size:0.78rem; color:var(--text-muted);">IA não identificou valores</span>' : ''}
                        </div>
                        ${notesHtml}
                    </div>
                </div>`;
            }).join('');

            const allDone = this.state.staging.images.every(img => !img.analyzing);

            // Compute session averages for preview
            let avgSummary = '';
            if (allDone) {
                const validBf     = this.state.staging.images.map(i => i.bf).filter(v => v !== null);
                const validWeight = this.state.staging.images.map(i => i.weight).filter(v => v !== null);
                const avgBf     = validBf.length     ? (validBf.reduce((a, b) => a + b, 0)     / validBf.length).toFixed(1)     : null;
                const avgWeight = validWeight.length ? (validWeight.reduce((a, b) => a + b, 0) / validWeight.length).toFixed(1) : null;
                if (avgBf || avgWeight) {
                    avgSummary = `
                    <div style="background:rgba(255,65,108,0.08); border:1px solid var(--primary-light); border-radius:8px; padding:0.7rem 1rem; margin-top:0.8rem; display:flex; justify-content:space-around;">
                        ${avgBf     ? `<div style="text-align:center;"><div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:3px;">Média BF</div><strong style="color:var(--primary);">${avgBf}%</strong></div>` : ''}
                        ${avgWeight ? `<div style="text-align:center;"><div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:3px;">Média Peso</div><strong style="color:var(--text-main);">${avgWeight} kg</strong></div>` : ''}
                    </div>`;
                }
            }

            stagingDiv.innerHTML = `
                <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.4rem;">
                    <i class="fa-solid fa-robot" style="color:var(--primary);"></i> Análise de composição corporal pela IA:
                </div>
                ${photoRows}
                ${avgSummary}
                ${allDone ? `
                <button class="btn btn-primary mt-3" id="btn-save-record" style="width:100%; padding:0.8rem;">
                    <i class="fa-solid fa-floppy-disk"></i> Salvar Registro Clínico
                </button>
                <button class="btn mt-2" id="btn-cancel-staging" style="width:100%; padding:0.5rem; background:transparent; border:1px solid var(--glass-border); color:var(--text-muted);">Cancelar</button>
                ` : `<p style="text-align:center; color:var(--text-muted); font-size:0.8rem; margin-top:0.8rem;">Aguardando análise das fotos...</p>`}
            `;

            if (allDone) {
                document.getElementById('btn-save-record').addEventListener('click', async () => {
                    const s = this.state.staging;
                    const btnSave = document.getElementById('btn-save-record');
                    btnSave.disabled = true;
                    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Armazenando...';

                    try {
                        const { data: { user } } = await window.supabaseClient.auth.getUser();
                        if (!user) throw new Error("Usuário não logado");

                        // Upload images to Supabase Storage
                        const publicUrls = [];
                        for (const img of s.images) {
                            const fileExt = img.file.name.split('.').pop();
                            const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                            const { error: uploadError } = await window.supabaseClient.storage
                                .from('evolution_photos').upload(fileName, img.file);
                            if (uploadError) throw uploadError;

                            const { data: urlData } = window.supabaseClient.storage
                                .from('evolution_photos').getPublicUrl(fileName);
                            publicUrls.push(urlData.publicUrl);
                        }

                        // Compute averages
                        const validBf     = s.images.map(i => i.bf).filter(v => v !== null);
                        const validWeight = s.images.map(i => i.weight).filter(v => v !== null);
                        const avgBf     = validBf.length     ? parseFloat((validBf.reduce((a, b) => a + b, 0)     / validBf.length).toFixed(1))     : null;
                        const avgWeight = validWeight.length ? parseFloat((validWeight.reduce((a, b) => a + b, 0) / validWeight.length).toFixed(1)) : null;

                        const { error: dbError } = await window.supabaseClient
                            .from('evolution_logs').insert([{
                                user_id: user.id,
                                log_date: s.date,
                                title: s.title,
                                average_bf: avgBf,
                                average_weight: avgWeight,
                                photos_urls: publicUrls
                            }]);
                        if (dbError) throw dbError;

                        this.state.staging = null;
                        document.getElementById('photo-title').value = '';
                        document.getElementById('file-input').value = '';
                        document.getElementById('btn-upload-photo').disabled = false;
                        await this.render();
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
            }
        },

        renderGallery() {
            const list = document.getElementById('gallery-list');

            if (this.state.entries.length === 0) {
                list.innerHTML = `<div style="color:var(--text-muted); font-size:0.8rem; text-align:center; padding: 2rem 0;">Nenhuma foto salva. Não tenha medo de registrar o antes!</div>`;
                return;
            }

            list.innerHTML = this.state.entries.map(entry => {
                const avgBf     = entry.bf     != null ? entry.bf     : '?';
                const avgWeight = entry.weight != null ? entry.weight : '?';
                const imageCount = entry.images.length;
                const gridCols   = Math.min(imageCount, 3);

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
                                <img src="${img.url}" data-zoom="${img.url}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9; cursor:zoom-in;" alt="Evolução">
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
